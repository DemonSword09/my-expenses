import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';

import { CsvHelper } from '../utils/CsvHelper';
import { ColumnMapping, Transaction, Category, Payee } from '../db/models';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { exec } from '../db/sqlite';
import { uuidSync } from '../utils/uuid';
import { useAppData } from '../context/AppDataProvider';
import { TransactionService } from '../services/TransactionService';
import { CSV_CONFIG, TRANSACTION_STATUS } from '../constants';

type LookupMaps = {
    categories: Map<string, string>;
    payees: Map<string, string>;
};

function buildLookupMaps(
    categories: Category[],
    payees: Payee[]
): LookupMaps {
    return {
        categories: new Map(categories.map((c) => [c.label.toLowerCase(), c.id])),
        payees: new Map(payees.map((p) => [p.name.toLowerCase(), p.id])),
    };
}

function detectDateFormatFromRows(
    rows: Record<string, string>[],
    mappings: ColumnMapping[]
): string | null {
    const dateMapping = mappings.find((m) => m.appField === 'date');
    if (!dateMapping) return null;

    // Try up to 10 rows to find a valid date format
    for (const row of rows.slice(0, 10)) {
        const val = row[dateMapping.csvColumn];
        if (val) {
            const fmt = CsvHelper.detectDateFormat(val);
            if (fmt) return fmt;
        }
    }
    return null;
}

async function resolveOrCreatePayee(
    payeeName: string,
    lookupMaps: LookupMaps
): Promise<string | null> {
    if (!payeeName) return null;

    const payeeKey = payeeName.toLowerCase();
    let payeeId = lookupMaps.payees.get(payeeKey);

    if (!payeeId) {
        const newPayee = await TransactionRepo.addPayee({ name: payeeName });
        payeeId = newPayee.id;
        lookupMaps.payees.set(payeeKey, payeeId);
    }

    return payeeId;
}

function mapCsvRowToTransaction(
    row: Record<string, string>,
    mappings: ColumnMapping[],
    lookupMaps: LookupMaps,
    dateFormat: string | null,
    defaultAccountId: string
): { mapped: Record<string, any>; categoryId: string | null } {
    const mapped: Record<string, any> = {};

    mappings.forEach((m) => {
        if (m.appField !== 'ignore') {
            let value = row[m.csvColumn];
            // Strip surrounding quotes if present
            if (value && typeof value === 'string') {
                value = value.replace(/^["']|["']$/g, '');
            }
            mapped[m.appField] = value;
        }
    });

    const { category, subcategory } = CsvHelper.splitCategory(
        mapped.category || ''
    );

    // Try subcategory first, then main category
    let categoryId = null;
    if (subcategory) {
        categoryId = lookupMaps.categories.get(subcategory.toLowerCase()) || null;
    }

    if (!categoryId) {
        categoryId = lookupMaps.categories.get(category.toLowerCase()) || null;
    }

    // Keep the resolved name for the transaction record
    mapped.category = subcategory || category;

    let createdAt = Date.now();
    if (mapped.date && dateFormat) {
        const normalized = CsvHelper.normalizeDate(mapped.date, dateFormat);
        if (normalized) {
            createdAt = new Date(normalized).getTime();
        }
    }

    mapped.createdAt = createdAt;
    mapped.amount = CsvHelper.normalizeAmount(mapped.amount || '0');

    return { mapped, categoryId };
}

export function useCsvImport() {
    const navigation = useNavigation();
    const { categories, payees, refreshData } = useAppData();

    const [headers, setHeaders] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Store file URI for lazy reading on import
    const fileUriRef = useRef<string | null>(null);
    const fileContentRef = useRef<string | null>(null);

    const pickCsv = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'text/*',
            });

            if (!result.assets?.[0]) return;

            setIsPreviewLoading(true);

            const file = result.assets[0];
            // Store URI for full file read on import
            fileUriRef.current = file.uri;

            // Read file - but for preview, only use first part
            const startRead = Date.now();
            const fileObj = new ExpoFile(file.uri);
            const fullContent = await fileObj.text();

            // For preview: Use only first 20KB worth of characters
            // This is enough for ~100 rows, makes parsing much faster
            const PREVIEW_CHARS = 10000; // ~20KB (reduced from 100KB)
            const previewContent = fullContent.substring(0, PREVIEW_CHARS);

            // Parse preview from first 100KB
            const startParse = Date.now();
            const preview = await CsvHelper.parseCsvPreview(
                previewContent,
                CSV_CONFIG.PREVIEW_ROWS
            );
            const startMapping = Date.now();
            const mappings = CsvHelper.autoMapColumns(preview.headers);
            const startStateUpdate = Date.now();
            setHeaders(preview.headers);

            // Clean quotes from preview rows
            const cleanPreviewRows = preview.rows.map(row => {
                const cleanRow: Record<string, string> = {};
                Object.keys(row).forEach(key => {
                    let val = row[key];
                    if (val && typeof val === 'string') {
                        val = val.replace(/^["']|["']$/g, '');
                    }
                    cleanRow[key] = val;
                });
                return cleanRow;
            });

            setPreviewRows(cleanPreviewRows);
            setMappings(mappings);

            // Store full content for import (already loaded)
            fileContentRef.current = fullContent;

        } catch (err) {
            console.error('❌ [CSV] CSV file selection failed', err);
            Alert.alert('Error', 'Failed to load CSV file.');
        } finally {
            setIsPreviewLoading(false);
        }
    }, []);

    const onImport = useCallback(async () => {
        const fileContent = fileContentRef.current;
        if (!fileContent) {
            Alert.alert('No Data', 'Please select a CSV file first.');
            return;
        }

        const lookupMaps = buildLookupMaps(categories, payees);

        setIsLoading(true);
        setProgress(0);

        try {
            await exec('BEGIN TRANSACTION');

            const defaultAccountId = await TransactionService.ensureDefaultAccount();

            let totalCreated = 0;
            let batch: Partial<Transaction>[] = [];
            let dateFormat: string | null = null;

            // Stream the CSV file with chunked processing
            // Calculate file size from content string (approx bytes)
            const fileSize = new Blob([fileContent]).size;

            await CsvHelper.streamCsv(
                fileContent,
                fileSize,
                async (rows, headers) => {
                    // Detect date format from first chunk
                    if (!dateFormat && rows.length > 0) {
                        dateFormat = detectDateFormatFromRows(rows, mappings);
                    }

                    // Process each row in the chunk
                    for (const row of rows) {
                        const { mapped, categoryId } = mapCsvRowToTransaction(
                            row,
                            mappings,
                            lookupMaps,
                            dateFormat,
                            defaultAccountId
                        );

                        const payeeId = await resolveOrCreatePayee(
                            (mapped.payee || '').trim(),
                            lookupMaps
                        );

                        batch.push({
                            id: uuidSync(),
                            amount: mapped.amount,
                            comment: mapped.notes || null,
                            accountId: defaultAccountId,
                            payeeId,
                            categoryId,
                            status: TRANSACTION_STATUS.CLEARED,
                            createdAt: mapped.createdAt,
                            deleted: 0,
                        });

                        // Batch insert when we hit the batch size
                        if (batch.length >= CSV_CONFIG.BATCH_SIZE) {
                            await TransactionRepo.createMany(batch);
                            totalCreated += batch.length;
                            batch = [];
                        }
                    }
                },
                (processed, total) => {
                    // Update progress based on bytes processed
                    if (total > 0) {
                        const percent = processed / total;
                        setProgress(percent);
                    }
                }
            );

            // Insert any remaining rows
            if (batch.length > 0) {
                await TransactionRepo.createMany(batch);
                totalCreated += batch.length;
            }

            await exec('COMMIT');
            await refreshData();

            setProgress(1);
            setIsLoading(false);
            navigation.goBack();

            console.log(`Successfully imported ${totalCreated} transactions`);
        } catch (err) {
            console.error('Import failed', err);
            await exec('ROLLBACK');
            setIsLoading(false);
            setProgress(0);
            Alert.alert(
                'Import Failed',
                'An error occurred while importing transactions. All changes have been rolled back.'
            );
        }
    }, [categories, payees, mappings, refreshData, navigation]);

    return {
        headers,
        rows: previewRows,
        mappings,
        setMappings,
        isLoading,
        isPreviewLoading,
        progress,
        pickCsv,
        onImport,
    };
}
