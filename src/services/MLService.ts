import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import { BertTokenizer } from './Tokenizer';
import { useMLStore } from '../store/useMLStore';

// CONSTANTS MATCHING PYTHON TRAINING CONFIG
const INTENT_LABELS = ['SUM', 'LIST', 'COUNT', 'MAX', 'MIN', 'AVG'];
const SLOT_LABELS = ['O', 'B-CAT', 'I-CAT', 'B-SUBCAT', 'I-SUBCAT', 'B-TIME', 'I-TIME', 'B-TYPE', 'I-TYPE'];

export interface MLPrediction {
    intent: string;
    confidence: number;
    slots: {
        category?: string;
        date?: string;
        subCategory?: string;
        type?: string;
        [key: string]: string | undefined;
    };
    rawSlots?: any; // Debugging
}

export class MLServiceModule {
    private session: InferenceSession | null = null;
    private tokenizer = new BertTokenizer();
    private isReady = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Initializes the ML Service. Safe to call multiple times.
     */
    async load(): Promise<void> {
        if (this.isReady) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = this._loadInternal();
        return this.loadPromise;
    }

    private async _loadInternal(): Promise<void> {
        try {
            console.log('[MLService] Loading...');
            const start = Date.now();

            // 1. Load Tokenizer
            await this.tokenizer.load();

            // 2. Resolve Model Path
            let modelPath = '';
            const cacheFile = new File(Paths.cache, 'expense_tracker.quant.onnx');

            if (cacheFile.exists) {
                console.log('[MLService] Found model in cache');
                modelPath = cacheFile.uri;
            } else {
                console.log('[MLService] Downloading/Copying model to cache...');
                const asset = Asset.fromModule(require('../../assets/expense_tracker.quant.onnx'));
                await asset.downloadAsync();

                if (!asset.localUri) throw new Error("Asset localUri is null");

                const assetFile = new File(asset.localUri);
                // Copy to cache for stable path
                assetFile.copy(cacheFile);
                modelPath = asset.localUri;
            }

            // 3. Create Session
            this.session = await InferenceSession.create(modelPath, {
                executionProviders: ['cpu'],
                graphOptimizationLevel: 'all',
            } as any);

            this.isReady = true;
            useMLStore.getState().setReady(true);
            console.log(`[MLService] Ready in ${Date.now() - start}ms`);

        } catch (err) {
            console.error('[MLService] Failed to load:', err);
            this.isReady = false;
            this.loadPromise = null; // Allow retry
            throw err;
        }
    }

    /**
     * Runs inference on the text.
     * Returns NULL if service is not ready or fails.
     * Does NOT handle business logic or context.
     */
    async predict(text: string): Promise<MLPrediction | null> {
        if (!this.isReady || !this.session) {
            console.warn('[MLService] Not ready. Call load() first.');
            return null;
        }

        try {
            // 1. Tokenize
            const { inputIds, attentionMask } = this.tokenizer.encode(text);

            // 2. Prepare Tensors
            const inputTensor = new Tensor('int64', new BigInt64Array(inputIds.map(BigInt)), [1, inputIds.length]);
            const maskTensor = new Tensor('int64', new BigInt64Array(attentionMask.map(BigInt)), [1, attentionMask.length]);

            // 3. Run Inference
            const results = await this.session.run({
                input_ids: inputTensor,
                attention_mask: maskTensor,
            });

            // 4. Decode Intent
            const intentLogits = Array.from(results.intent_logits.data as Float32Array);
            const intentProbs = this.softmax(intentLogits);
            const intentIdx = this.argmax(intentProbs);
            const intent = INTENT_LABELS[intentIdx] || 'UNKNOWN';
            const confidence = intentProbs[intentIdx];

            // 5. Decode Slots
            const slotLogits = results.slot_logits.data as Float32Array;
            const seqLen = inputIds.length;
            const numSlots = SLOT_LABELS.length;

            const slotTags: string[] = [];
            for (let i = 0; i < seqLen; i++) {
                // Stride = numSlots
                const start = i * numSlots;
                const end = start + numSlots;
                const tokenLogits = slotLogits.slice(start, end);
                const slotIdx = this.argmax(tokenLogits);
                slotTags.push(SLOT_LABELS[slotIdx]);
            }

            // 6. Reconstruct Entities
            // Note: Tokenizer needs to expose subwords or we re-tokenize to align
            // Assuming tokenizer.tokenize(text) matches inputIds length exactly (ignoring CLS/SEP handling for a moment)
            // Ideally Tokenizer.encode returns the tokens too.
            // For now, re-using tokenizer.tokenize which aligns with our previous logic.
            const subwords = this.tokenizer['tokenize'](text);
            const slots = this.decodeSlots(subwords, slotTags);

            return {
                intent,
                confidence,
                slots
            };

        } catch (e) {
            console.error('[MLService] Inference error:', e);
            return null;
        }
    }

    private decodeSlots(subwords: string[], slotTags: string[]) {
        const slots: any = {};
        let currentEntity = "";
        let currentLabel = "";

        // slotTags has CLS at 0, SEP at end.
        // subwords has length N per actual words.
        // Align: slotTags[1] corresponds to subwords[0] usually

        // Loop over SUBWORDS
        for (let i = 0; i < subwords.length; i++) {
            // Tag index offset by +1 for CLS
            const tagIdx = i + 1;
            if (tagIdx >= slotTags.length) break;

            const tag = slotTags[tagIdx];
            const subword = subwords[i];
            const cleanSubword = subword.startsWith('##') ? subword.substring(2) : subword;

            if (tag.startsWith("B-")) {
                if (currentEntity) {
                    this.addSlot(slots, currentLabel, currentEntity);
                }
                currentLabel = tag.substring(2); // "CAT"
                currentEntity = cleanSubword;
            } else if (tag.startsWith("I-") && currentLabel === tag.substring(2)) {
                // Continuation
                if (subword.startsWith('##')) {
                    currentEntity += cleanSubword;
                } else {
                    currentEntity += " " + cleanSubword;
                }
            } else {
                // O or Mismatch
                if (currentEntity) {
                    this.addSlot(slots, currentLabel, currentEntity);
                    currentEntity = "";
                    currentLabel = "";
                }
            }
        }

        // Flush last
        if (currentEntity) {
            this.addSlot(slots, currentLabel, currentEntity);
        }
        return slots;
    }

    private addSlot(slots: any, label: string, value: string) {
        if (label === 'CAT') slots.category = value;
        if (label === 'TIME') slots.date = value;
        if (label === 'SUBCAT') slots.subCategory = value;
        if (label === 'TYPE') slots.type = value;
    }

    private argmax(arr: Float32Array | number[]): number {
        let max = -Infinity;
        let idx = -1;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
                idx = i;
            }
        }
        return idx;
    }

    private softmax(arr: number[]): number[] {
        const max = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(x => x / sum);
    }
}

export const MLService = new MLServiceModule();
