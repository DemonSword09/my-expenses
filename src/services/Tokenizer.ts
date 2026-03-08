import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { File as ExpoFile } from 'expo-file-system';

export class BertTokenizer {
    private vocab: Map<string, number>;
    private idsToTokens: Map<number, string>;
    private isLoaded: boolean = false;

    constructor() {
        this.vocab = new Map();
        this.idsToTokens = new Map();
    }

    async load(): Promise<void> {
        if (this.isLoaded) return;

        try {
            // Load vocab.txt from assets
            const asset = Asset.fromModule(require('../../assets/vocab.txt'));
            await asset.downloadAsync();

            // Read content using new File API (aliased to avoid global File conflict)
            const file = new ExpoFile(asset.localUri!);
            const text = await file.text();
            const lines = text.split('\n');

            lines.forEach((line, index) => {
                const token = line.trim();
                if (token) {
                    this.vocab.set(token, index);
                    this.idsToTokens.set(index, token);
                }
            });

            this.isLoaded = true;
            console.log('Tokenizer loaded with vocab size:', this.vocab.size);
        } catch (error) {
            console.error('Failed to load tokenizer vocab:', error);
            throw error;
        }
    }

    encode(text: string, maxLength: number = 32): { inputIds: number[], attentionMask: number[] } {
        if (!this.isLoaded) throw new Error("Tokenizer not loaded. Call load() first.");

        const tokens = this.tokenize(text);

        // Add [CLS] and [SEP]
        // CLS = 101, SEP = 102 (Standard BERT/DistilBERT)
        // Adjust if your vocab differs, but standard is usually this.
        // We can look it up to be safe if loaded.
        const clsId = this.vocab.get('[CLS]') || 101;
        const sepId = this.vocab.get('[SEP]') || 102;
        const padId = this.vocab.get('[PAD]') || 0;
        const unkId = this.vocab.get('[UNK]') || 100;

        let inputIds = [clsId];

        for (const token of tokens) {
            const id = this.vocab.get(token) || unkId;
            inputIds.push(id);
        }

        inputIds.push(sepId);

        // Truncate
        if (inputIds.length > maxLength) {
            inputIds = inputIds.slice(0, maxLength);
            inputIds[maxLength - 1] = sepId; // Ensure SEP at end
        }

        // Attention Mask (1 for real tokens, 0 for pad)
        const attentionMask = new Array(inputIds.length).fill(1);

        // Padding
        while (inputIds.length < maxLength) {
            inputIds.push(padId);
            attentionMask.push(0);
        }

        return { inputIds, attentionMask };
    }

    private tokenize(text: string): string[] {
        const tokens: string[] = [];
        const cleanText = this.cleanText(text);

        const words = cleanText.split(/\s+/);

        for (const word of words) {
            if (!word) continue;

            // WordPiece logic
            const subwords = this.wordPiece(word);
            tokens.push(...subwords);
        }

        return tokens;
    }

    private cleanText(text: string): string {
        // Lowercase and basic normalization
        return text.toLowerCase()
            .replace(/([.,!?;:()])/g, ' $1 ') // Split punctuation
            .replace(/\s+/g, ' ')
            .trim();
    }

    private wordPiece(word: string): string[] {
        // Max chars per word to avoid infinite loops or crazy tokens
        if (word.length > 100) return [this.vocab.has('[UNK]') ? '[UNK]' : 'unk'];

        const subwords: string[] = [];
        let start = 0;

        while (start < word.length) {
            let end = word.length;
            let curSubword: string | null = null;

            while (start < end) {
                let substr = word.substring(start, end);
                if (start > 0) substr = '##' + substr;

                if (this.vocab.has(substr)) {
                    curSubword = substr;
                    break;
                }
                end--;
            }

            if (curSubword === null) {
                // If we can't map even a single char, return UNK for the whole word usually
                // Or just the char as UNK.
                return ['[UNK]'];
            }

            subwords.push(curSubword);
            start = end;
        }

        return subwords;
    }

    getLabel(id: number, type: 'INTENT' | 'SLOT'): string {
        // This helper might need mappings provided externally
        return "";
    }
}
