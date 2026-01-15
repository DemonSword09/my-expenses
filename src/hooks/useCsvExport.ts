import { useCallback, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { TransactionDetail } from '../db/models';
import { CsvHelper } from '../utils/CsvHelper';


const CSV_DIR = "content://com.android.externalstorage.documents/tree/primary%3Abak/Csv"
// FileSystem.Directory.pickDirectoryAsync().then(dir => console.log(dir));
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

            // 1. Transform Data
            const exportData = transactions.map(t => {
                const dateStr = format(new Date(t.createdAt), dateFormat);

                // Amount: Negative if Expense, Positive if Income
                const amountVal = (t.transaction_type === 'EXPENSE') ? -t.amount : t.amount;

                // Category: Parent > Child or just Child
                let categoryStr = '';
                if (t.category_label) {
                    categoryStr = t.category_parent_label
                        ? `${t.category_parent_label}:${t.category_label}`
                        : t.category_label;
                }

                return {
                    Date: dateStr,
                    Payee: t.payee_name || '',
                    Amount: amountVal.toFixed(2),
                    Category: categoryStr,
                    Notes: t.comment || '',
                    Status: t.status || '',
                    Account: 'Default' // Placeholder
                };
            });

            // 2. Generate CSV
            const csvString = CsvHelper.generateCsv(exportData, {
                delimiter: delimiter
            });

            // 3. Save to Temp File
            const fileName = `Expenses_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
            const CURRENT_EXPORT_FILE = new FileSystem.File(CSV_DIR, fileName);
            console.log(CURRENT_EXPORT_FILE.exists);

            // Using deprecated writeAsStringAsync as new File API caused URI issues on Android
            await CURRENT_EXPORT_FILE.write(csvString, {
                encoding: 'utf8'
            });

            // 4. Share
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(CURRENT_EXPORT_FILE.uri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Expenses CSV'
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
        isExporting
    };
}
