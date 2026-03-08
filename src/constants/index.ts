export const CSV_CONFIG = {
    PREVIEW_ROWS: 15, // Reduced from 50 for faster rendering
    BATCH_SIZE: 50,
} as const;

export const DATE_FORMATS = [
    'd-MMM-yy',
    'dd-MMM-yy',
    'yyyy-MM-dd',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'dd-MM-yyyy',
    'd-MMM-yyyy',
    'dd-MMM-yyyy',
    'MMM dd, yyyy',
] as const;

export const MONTHS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
] as const;

export const TRANSACTION_STATUS = {
    CLEARED: 'cleared',
    PENDING: 'pending',
    RECONCILED: 'reconciled',
} as const;

export const DB_BATCH_SIZE = 100;
