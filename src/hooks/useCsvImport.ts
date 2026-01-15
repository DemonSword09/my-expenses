import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { CsvHelper } from '../utils/CsvHelper';
import { ColumnMapping, Transaction } from '../db/models';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { exec } from '../db/sqlite';
import { uuidSync } from '../utils/uuid';
import { useAppData } from '../context/AppDataProvider';
import { TransactionService } from '../services/TransactionService';

export function useCsvImport() {
    const navigation = useNavigation();
    const { categories, payees, refreshData } = useAppData();

    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const pickCsv = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'text/*',
            });

            if (result.assets?.[0]) {
                const file = result.assets[0];
                const fileObj = new ExpoFile(file.uri);
                const content = await fileObj.text();

                const parsed = await CsvHelper.parseCsv(content);
                setHeaders(parsed.headers);
                setRows(parsed.rows);

                const autoMapped = CsvHelper.autoMapColumns(parsed.headers);
                setMappings(autoMapped);
            }
        } catch (err) {
            console.error('Pick CSV failed', err);
        }
    }, []);

    const onImport = useCallback(async () => {
        // map the rows to updated column mappings
        const categoriesMap = new Map<string, string>(); // name.lower -> id
        categories.forEach(c => {
            categoriesMap.set(c.label.toLowerCase(), c.id);
        });

        const payeesMap = new Map<string, string>(); // name.lower -> id
        payees.forEach(p => {
            payeesMap.set(p.name.toLowerCase(), p.id);
        });

        // Detect valid date format from the first non-empty date row
        let dateFormat: string | null = null;
        const dateMapping = mappings.find(m => m.appField === 'date');
        if (dateMapping) {
            const sampleRow = rows.find(r => r[dateMapping.csvColumn]);
            if (sampleRow) {
                dateFormat = CsvHelper.detectDateFormat(sampleRow[dateMapping.csvColumn]);
            }
        }

        setIsLoading(true);
        setProgress(0);

        try {
            await exec('BEGIN TRANSACTION');

            // Optimisation: Ensure default account exists ONCE
            const defaultAccountId = await TransactionService.ensureDefaultAccount();

            const total = rows.length;
            let processed = 0;
            let createdCount = 0;
            let batch: Partial<Transaction>[] = [];

            for (const row of rows) {
                processed++;
                // UI update moved to batch flush

                const mappedRow: Record<string, any> = {};

                mappings.forEach((mapping) => {
                    if (mapping.appField === 'ignore') return;
                    mappedRow[mapping.appField] = row[mapping.csvColumn];
                });
                const { category, subcategory } = CsvHelper.splitCategory(mappedRow.category || '');
                mappedRow.category = category;
                mappedRow.subcategory = subcategory;


                //normalize amount
                mappedRow.amount = CsvHelper.normalizeAmount(mappedRow.amount);

                // Lookup Category (O(1))
                if (mappedRow.subcategory) {
                    mappedRow.category = subcategory;
                }
                const categoryId = categoriesMap.get((mappedRow.category || '').toLowerCase()) || null;
                // Lookup Payee (O(1))
                const payeeName = (mappedRow.payee || '').trim();
                const payeeNameLower = payeeName.toLowerCase();
                let payeeId: string | null | undefined = payeesMap.get(payeeNameLower);

                if (!payeeId && payeeName) {
                    // Create new payee on fly
                    const payee = await TransactionRepo.addPayee({ name: payeeName });
                    payeeId = payee.id;
                    payeesMap.set(payeeNameLower, payeeId); // Cache it immediately
                } else if (!payeeId) {
                    // Fallback if no name provided
                    payeeId = null;
                }

                // Parse Date
                let createdAt = Date.now();
                if (mappedRow.date) {
                    let normalized: string | null = null;

                    if (dateFormat) {
                        normalized = CsvHelper.normalizeDate(mappedRow.date, dateFormat);
                    }

                    // Fallback: Try per-row detection if global failed
                    if (!normalized) {
                        const rowFormat = CsvHelper.detectDateFormat(mappedRow.date);
                        if (rowFormat) {
                            normalized = CsvHelper.normalizeDate(mappedRow.date, rowFormat);
                        }
                    }

                    if (normalized) {
                        createdAt = new Date(normalized).getTime();
                    } else {
                        // Last resort: Strict parse
                        const direct = new Date(mappedRow.date).getTime();
                        if (!isNaN(direct)) createdAt = direct;
                    }
                }

                // Construct Transaction Payload
                // Robust amount handling 
                const rawAmt = typeof mappedRow.amount === 'number' ? mappedRow.amount : parseFloat(mappedRow.amount || '0');
                const safeAmount = isNaN(rawAmt) ? 0 : rawAmt;

                const transactionPayload: Partial<Transaction> = {
                    id: uuidSync(),
                    amount: safeAmount,
                    comment: mappedRow.notes || null,
                    accountId: defaultAccountId, // Use cached default account
                    payeeId: payeeId,
                    categoryId: categoryId,
                    status: 'cleared',
                    createdAt: createdAt,
                    deleted: 0
                };

                batch.push(transactionPayload);

                if (batch.length >= 50) {
                    await TransactionRepo.createMany(batch);
                    createdCount += batch.length;
                    batch = [];

                    // UI Update
                    setProgress(processed / total);
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            // Flush remaining
            if (batch.length > 0) {
                await TransactionRepo.createMany(batch);
                createdCount += batch.length;
            }
            await exec('COMMIT');

            // Sync global data as we might have added payees
            await refreshData();

            // finish up animation
            setProgress(1);
            await new Promise(r => setTimeout(r, 500));

            setIsLoading(false);
            console.log(createdCount + " Transactions imported");
            navigation.goBack();

        } catch (err) {
            console.error('Import failed', err);
            await exec('ROLLBACK');
            Alert.alert('Import Failed', 'An error occurred while importing transactions. Please check the CSV format.');
            setIsLoading(false);
        }
    }, [categories, payees, rows, mappings, navigation, refreshData]);

    return {
        headers,
        rows,
        mappings,
        setMappings,
        isLoading,
        progress,
        pickCsv,
        onImport
    };
}
