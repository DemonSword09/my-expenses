import { useCallback, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { TransactionDetail } from '../db/models';
import { CsvHelper } from '../utils/CsvHelper';

export function useCsvExport() {
    const [isExporting, setIsExporting] = useState(false);

    const exportToCsv = useCallback(async (
        transactions: TransactionDetail[],
        delimiter: string,
        dateFormat: string
    ) => {
        try {
            setIsExporting(true);

            if (!transactions || transactions.length === 0) {
                alert('No transactions to export.');
                return;
            }

            /* ---------- 1. Transform data ---------- */
            const exportData = transactions.map(t => {
                const dateStr = format(new Date(t.createdAt), dateFormat);

                const amountVal =
                    t.transaction_type === 'EXPENSE' ? -t.amount : t.amount;

                const categoryStr = t.category_label
                    ? t.category_parent_label
                        ? `${t.category_parent_label}:${t.category_label}`
                        : t.category_label
                    : '';

                return {
                    Date: dateStr,
                    Payee: t.payee_name || '',
                    Amount: amountVal.toFixed(2),
                    Category: categoryStr,
                    Notes: t.comment || '',
                    Status: t.status || '',
                    Account: 'Default',
                };
            });

            /* ---------- 2. Generate CSV ---------- */
            const csvString = CsvHelper.generateCsv(exportData, {
                delimiter,
            });

            /* ---------- 3. Pick/Load Directory & Write ---------- */
            const CSV_DIR_KEY = 'CSV_EXPORT_DIRECTORY';

            let directory = null;
            const savedDirUri = await AsyncStorage.getItem(CSV_DIR_KEY);

            if (savedDirUri) {
                try {
                    const d = new FileSystem.Directory(savedDirUri);
                    if (d.exists) {
                        directory = d;
                    }
                } catch (e) {
                    console.warn('Failed to restore directory from URI', e);
                }
            }

            if (!directory) {
                directory = await FileSystem.Directory.pickDirectoryAsync();
                if (directory) {
                    await AsyncStorage.setItem(CSV_DIR_KEY, directory.uri);
                }
            }

            if (!directory) {
                // User cancelled picking
                setIsExporting(false);
                return;
            }

            const fileName = `Expenses_${format(
                new Date(),
                'yyyyMMdd_HHmmss'
            )}.csv`;

            const file = directory.createFile(fileName, 'text/csv');
            await file.write(csvString);

            const fileUri = file.uri;

            /* ---------- 4. Share (via Cache) ---------- */
            // Expo Sharing only supports file:// URIs, so we create a temp copy
            const cacheFile = new FileSystem.File(FileSystem.Paths.cache, fileName);
            await cacheFile.write(csvString);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(cacheFile.uri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Expenses CSV',
                });
            } else {
                alert('Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Export failed', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        exportToCsv,
        isExporting,
    };
}
