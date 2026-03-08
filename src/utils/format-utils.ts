export function normalizeAmount(value: string): number {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
    return `${currency}${Math.abs(amount).toFixed(2)}`;
}

export function formatDate(
    timestamp: number,
    options?: Intl.DateTimeFormatOptions
): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    };
    return new Date(timestamp).toLocaleDateString(
        undefined,
        options || defaultOptions
    );
}

export function capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
}
