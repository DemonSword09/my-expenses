import { CategoryRepo } from '../../db/repositories/CategoryRepo';
import { parseDateRange } from '../../utils/date-utils';

/**
 * Validation result for a slot value
 */
export interface SlotValidationResult {
    valid: boolean;
    reason?: string;
    corrected?: string;
    normalized?: any;
}

/**
 * Slot conflict detected during merging
 */
export interface SlotConflict {
    slot: string;
    existing: any;
    incoming: any;
    isCritical: boolean;
}

/**
 * Result of slot merge operation
 */
export interface SlotMergeResult {
    merged: Record<string, any>;
    conflicts: SlotConflict[];
    overwrites: string[];
}

// Critical slots that warrant user confirmation on overwrite
const CRITICAL_SLOTS = ['startDate', 'endDate', 'date'];

/**
 * Check if a slot is critical and should trigger user confirmation on conflict
 */
export function isCriticalSlot(slot: string): boolean {
    return CRITICAL_SLOTS.includes(slot);
}

/**
 * Check if two date values are mutually exclusive (e.g., January vs February)
 */
function areMutuallyExclusiveDates(existing: any, incoming: any): boolean {
    // If both are month-based and different months, they conflict
    if (typeof existing === 'string' && typeof incoming === 'string') {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const existingMonth = months.find(m => existing.toLowerCase().includes(m));
        const incomingMonth = months.find(m => incoming.toLowerCase().includes(m));

        if (existingMonth && incomingMonth && existingMonth !== incomingMonth) {
            return true;
        }
    }
    return false;
}

/**
 * Check if incoming slot can refine existing slot (e.g., "2024" + "December" = "December 2024")
 */
function canRefineSlot(existing: any, incoming: any): boolean {
    // Year + Month can refine
    if (typeof existing === 'string' && typeof incoming === 'string') {
        const yearPattern = /^\d{4}$/;
        const monthPattern = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

        // Year existing + month incoming
        if (yearPattern.test(existing) && monthPattern.test(incoming)) {
            return true;
        }
        // Month existing + year incoming
        if (monthPattern.test(existing) && yearPattern.test(incoming)) {
            return true;
        }
    }
    return false;
}

/**
 * Merge two slot values when they can be refined
 */
function refineSlot(existing: any, incoming: any): any {
    // Combine year and month
    if (typeof existing === 'string' && typeof incoming === 'string') {
        const yearPattern = /^\d{4}$/;
        if (yearPattern.test(existing)) {
            return `${incoming} ${existing}`;
        } else {
            return `${existing} ${incoming}`;
        }
    }
    return incoming;
}

/**
 * Merge slots with conflict detection and validation
 */
export function mergeSlots(
    existing: Record<string, any>,
    incoming: Record<string, any>,
    isCorrection: boolean = false
): SlotMergeResult {
    const conflicts: SlotConflict[] = [];
    const overwrites: string[] = [];
    const merged = { ...existing };

    for (const [key, value] of Object.entries(incoming)) {
        if (value === undefined || value === null) continue;

        if (!existing[key]) {
            // No conflict - simple add
            merged[key] = value;
        } else if (isCorrection) {
            // Explicit correction - replace
            merged[key] = value;
            overwrites.push(`${key}: ${existing[key]} → ${value} (correction)`);
        } else if (areMutuallyExclusiveDates(existing[key], value)) {
            // Conflicting dates - need user confirmation
            conflicts.push({
                slot: key,
                existing: existing[key],
                incoming: value,
                isCritical: isCriticalSlot(key),
            });
        } else if (canRefineSlot(existing[key], value)) {
            // Can refine (e.g., "2024" + "December")
            merged[key] = refineSlot(existing[key], value);
        } else {
            // Default: newer wins with warning
            merged[key] = value;
            overwrites.push(`${key}: ${existing[key]} → ${value}`);
        }
    }

    return { merged, conflicts, overwrites };
}

/**
 * Validate a category slot value
 */
export async function validateCategorySlot(value: string): Promise<SlotValidationResult> {
    const categories = await CategoryRepo.listAll();
    const match = categories.find(c => c.label.toLowerCase() === value.toLowerCase());

    if (match) {
        return { valid: true, normalized: match.id };
    }

    // Try fuzzy match
    const fuzzyMatch = categories.find(c =>
        c.label.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(c.label.toLowerCase())
    );

    if (fuzzyMatch) {
        return {
            valid: true,
            corrected: fuzzyMatch.label,
            normalized: fuzzyMatch.id,
        };
    }

    return { valid: false, reason: `Unknown category: ${value}` };
}

/**
 * Validate a date slot value
 */
export function validateDateSlot(value: string): SlotValidationResult {
    const parsed = parseDateRange(value);

    if (!parsed) {
        return { valid: false, reason: `Cannot parse date: ${value}` };
    }

    // Sanity check - not in distant future
    const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
    if (parsed.start > oneYearFromNow) {
        return { valid: false, reason: 'Date too far in future' };
    }

    return { valid: true, normalized: parsed };
}

/**
 * Check if a value looks like a date but is being used as a category (cross-slot confusion)
 */
export function isProbablyDate(value: string): boolean {
    const lower = value.toLowerCase();
    const datePatterns = [
        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
        /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        /^(yesterday|today|tomorrow|last|this|next)/i,
        /^\d{4}$/,
        /^\d{1,2}\/\d{1,2}/,
    ];
    return datePatterns.some(p => p.test(lower));
}

/**
 * Check if a value looks like a category but is being used as a date
 */
export function isProbablyCategory(value: string): boolean {
    const lower = value.toLowerCase();
    // Common expense categories
    const categoryPatterns = [
        /^(food|grocery|groceries|transport|travel|entertainment|shopping|bills|utilities)/i,
        /^(rent|salary|income|health|medical|education|clothing|personal)/i,
    ];
    return categoryPatterns.some(p => p.test(lower));
}

/**
 * Detect cross-slot semantic confusion
 */
export function detectSlotConfusion(slots: Record<string, any>): string[] {
    const issues: string[] = [];

    if (slots.category && isProbablyDate(slots.category)) {
        issues.push(`Category "${slots.category}" looks like a date`);
    }

    if (slots.date && isProbablyCategory(slots.date)) {
        issues.push(`Date "${slots.date}" looks like a category`);
    }

    return issues;
}
