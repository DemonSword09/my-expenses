import { MONTHS } from '../constants';

interface DateRange {
    start: number;
    end: number;
}

export function parseDateRange(text: string): DateRange | null {
    if (!text) return null;

    const lower = text.toLowerCase().trim();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // === Relative Time Expressions ===

    // "today"
    if (lower.includes('today')) {
        const start = new Date(currentYear, currentMonth, now.getDate(), 0, 0, 0);
        const end = new Date(currentYear, currentMonth, now.getDate(), 23, 59, 59);
        return { start: start.getTime(), end: end.getTime() };
    }

    // "yesterday"
    if (lower.includes('yesterday')) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
        const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        return { start: start.getTime(), end: end.getTime() };
    }

    // "this week"
    if (lower.includes('this week')) {
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek.getTime(), end: endOfWeek.getTime() };
    }

    // "last week"
    if (lower.includes('last week')) {
        const dayOfWeek = now.getDay();
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - dayOfWeek - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);
        return { start: startOfLastWeek.getTime(), end: endOfLastWeek.getTime() };
    }

    // "this month"
    if (lower.includes('this month')) {
        const start = new Date(currentYear, currentMonth, 1, 0, 0, 0);
        const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        return { start: start.getTime(), end: end.getTime() };
    }

    // "last month"
    if (lower.includes('last month')) {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const start = new Date(lastMonthYear, lastMonth, 1, 0, 0, 0);
        const end = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59);
        console.log(`[date-utils] Parsed "last month": ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
        return { start: start.getTime(), end: end.getTime() };
    }

    // "this year"
    if (lower.includes('this year')) {
        const start = new Date(currentYear, 0, 1, 0, 0, 0);
        const end = new Date(currentYear, 11, 31, 23, 59, 59);
        return { start: start.getTime(), end: end.getTime() };
    }

    // "last year"
    if (lower.includes('last year')) {
        const start = new Date(currentYear - 1, 0, 1, 0, 0, 0);
        const end = new Date(currentYear - 1, 11, 31, 23, 59, 59);
        return { start: start.getTime(), end: end.getTime() };
    }

    // "last N days"
    const lastNDaysMatch = lower.match(/last\s+(\d+)\s+days?/);
    if (lastNDaysMatch) {
        const days = parseInt(lastNDaysMatch[1], 10);
        const start = new Date(now);
        start.setDate(now.getDate() - days);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start: start.getTime(), end: end.getTime() };
    }

    // === Specific Year (e.g., "2024", "in 2024") ===
    const yearMatch = lower.match(/(?:^|\b)(19|20)\d{2}(?:\b|$)/);
    if (yearMatch && !lower.includes('-')) {
        const year = parseInt(yearMatch[0], 10);

        // Check for month + year combo
        for (let i = 0; i < 12; i++) {
            if (new RegExp(`\\b${MONTHS[i]}\\b`).test(lower)) {
                return {
                    start: new Date(year, i, 1).getTime(),
                    end: new Date(year, i + 1, 0, 23, 59, 59).getTime(),
                };
            }
        }

        // Just year
        return {
            start: new Date(year, 0, 1).getTime(),
            end: new Date(year, 11, 31, 23, 59, 59).getTime(),
        };
    }

    // === Specific Month (e.g., "january", "in december") ===
    for (let i = 0; i < 12; i++) {
        if (new RegExp(`\\b${MONTHS[i]}\\b`).test(lower)) {
            // If month is in the future, assume last year
            let year = currentYear;
            if (i > currentMonth) {
                year = currentYear - 1;
            }
            return {
                start: new Date(year, i, 1).getTime(),
                end: new Date(year, i + 1, 0, 23, 59, 59).getTime(),
            };
        }
    }

    return null;
}

export function getStartOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

export function getEndOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(23, 59, 59, 999);
    return date.getTime();
}

export function getStartOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getTime();
}

export function getEndOfMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
}
