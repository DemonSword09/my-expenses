import { ConversationContext } from './ConversationContext';

/**
 * Follow-up signal types for dialog state management
 */
export type FollowUpType = 'SLOT_REFINEMENT' | 'CORRECTION' | 'CONTINUATION' | 'NEW_QUERY';

export interface FollowUpSignal {
    isFollowUp: boolean;
    type: FollowUpType;
    confidence: number;
    reason: string;
}

// Common verbs that indicate a new query rather than a follow-up
const ACTION_VERBS = [
    'show', 'list', 'display', 'get', 'find', 'search',
    'total', 'sum', 'count', 'average', 'add', 'spent',
    'paid', 'bought', 'what', 'how', 'when', 'where',
];

// Prepositional phrases that typically refine slots
const SLOT_REFINEMENT_PATTERNS = [
    /^(for|in|on|during|from|since|until|before|after)\s+/i,
    /^(only|just|excluding?|including?)\s+/i,
    /^(last|this|next)\s+(week|month|year|day)/i,
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /^(yesterday|today|tomorrow)/i,
    /^\d{4}$/,  // Just a year like "2024"
];

// Correction markers that indicate the user is fixing something
const CORRECTION_PATTERNS = [
    /^(no|not|but|actually|wait|i meant|sorry|oops)/i,
    /^(instead|rather|correction)/i,
];

// Continuation markers that indicate adding to the query
const CONTINUATION_PATTERNS = [
    /^(and|also|plus|what about|as well|too)/i,
];

/**
 * Check if text contains any common action verbs
 */
function containsVerb(text: string): boolean {
    const lower = text.toLowerCase();
    return ACTION_VERBS.some(verb => {
        const regex = new RegExp(`\\b${verb}\\b`, 'i');
        return regex.test(lower);
    });
}

/**
 * Deterministic follow-up detection.
 * 
 * Critical design principle: Follow-up detection is a DIALOG STATE property,
 * not a semantic understanding. It should NOT rely on ML.
 */
export function detectFollowUp(text: string): FollowUpSignal {
    const lower = text.toLowerCase().trim();
    const wordCount = lower.split(/\s+/).length;

    // CRITICAL GUARD: No active context = cannot be a follow-up
    if (!ConversationContext.hasActiveIntent()) {
        return {
            isFollowUp: false,
            type: 'NEW_QUERY',
            confidence: 0.9,
            reason: 'No active intent context',
        };
    }

    // 1. Correction Markers (highest priority - user is fixing something)
    if (CORRECTION_PATTERNS.some(p => p.test(lower))) {
        return {
            isFollowUp: true,
            type: 'CORRECTION',
            confidence: 0.9,
            reason: 'Correction marker detected',
        };
    }

    // 2. Continuation Markers
    if (CONTINUATION_PATTERNS.some(p => p.test(lower))) {
        return {
            isFollowUp: true,
            type: 'CONTINUATION',
            confidence: 0.85,
            reason: 'Continuation marker detected',
        };
    }

    // 3. Prepositional Phrases (slot modifiers like "for food", "in December")
    if (SLOT_REFINEMENT_PATTERNS.some(p => p.test(lower))) {
        return {
            isFollowUp: true,
            type: 'SLOT_REFINEMENT',
            confidence: 0.95,
            reason: 'Slot refinement phrase detected',
        };
    }

    // 4. Fragment Detection (≤3 words, no verb) — ONLY if context exists
    if (wordCount <= 3 && !containsVerb(lower)) {
        return {
            isFollowUp: true,
            type: 'SLOT_REFINEMENT',
            confidence: 0.85,
            reason: 'Short fragment without verb',
        };
    }

    // 5. Has active context but message has action verbs → likely new query
    if (containsVerb(lower)) {
        return {
            isFollowUp: false,
            type: 'NEW_QUERY',
            confidence: 0.8,
            reason: 'Contains action verb suggesting new query',
        };
    }

    // 6. Default: If we have context and weak signal, treat as refinement
    return {
        isFollowUp: true,
        type: 'SLOT_REFINEMENT',
        confidence: 0.7,
        reason: 'Active context, no strong new query signal',
    };
}

/**
 * Check if the text looks like a simple slot value (category name, date, etc.)
 */
export function isSimpleSlotValue(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const wordCount = lower.split(/\s+/).length;

    // Single word or very short phrase
    if (wordCount <= 2 && !containsVerb(lower)) {
        return true;
    }

    // Just a date reference
    if (SLOT_REFINEMENT_PATTERNS.some(p => p.test(lower))) {
        return true;
    }

    return false;
}
