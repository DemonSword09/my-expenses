import { MLPrediction } from '../services/MLService';

export type IntentType = 'INSERT' | 'LIST' | 'SUM' | 'MAX' | 'MIN' | 'COUNT' | 'AVG' | 'UNKNOWN';

export interface IntentResult {
    intent: IntentType;
    confidence: number;
    source: 'RULE' | 'ML';
    hasExplicitKeyword: boolean;
    slots: {
        amount?: number;
        category?: string;
        subCategory?: string;
        date?: string;
        payee?: string;
        note?: string;
        type?: string;
        limit?: number;
    };
    rawText: string;
}

/**
 * Arbitration decision record for debugging and logging
 */
export interface ArbitrationDecision {
    timestamp: number;
    input: string;
    ruleIntent: IntentType | null;
    mlIntent: IntentType | null;
    mlConfidence: number;
    finalIntent: IntentType;
    finalConfidence: number;
    decidedBy: 'RULE' | 'ML' | 'FALLBACK';
    hasExplicitKeyword: boolean;
    reason: string;
}

export class IntentResolver {

    // Deterministic Keywords - these are EXPLICIT action words that can lock intent
    private static readonly KEYWORDS = {
        SUM: ['total', 'sum', 'how much', 'spent on'],
        COUNT: ['count', 'how many', 'number of', 'times'],
        MAX: ['max', 'highest', 'most', 'biggest', 'top'],
        MIN: ['min', 'lowest', 'least', 'smallest', 'cheapest'],
        AVG: ['avg', 'average', 'typical'],
        LIST: ['list', 'show', 'display', 'transactions', 'history', 'entries', 'spending', 'records', 'expenses']
    };

    // All keywords flattened for quick lookup
    private static readonly ALL_EXPLICIT_KEYWORDS = [
        ...IntentResolver.KEYWORDS.SUM,
        ...IntentResolver.KEYWORDS.COUNT,
        ...IntentResolver.KEYWORDS.MAX,
        ...IntentResolver.KEYWORDS.MIN,
        ...IntentResolver.KEYWORDS.AVG,
        ...IntentResolver.KEYWORDS.LIST,
        'spent', 'paid', 'bought', 'add', // INSERT keywords
    ];

    /**
     * Check if text contains an explicit action keyword that can lock intent.
     * This is CRITICAL for the safety rule: confidence alone cannot lock intent.
     */
    static hasExplicitKeyword(text: string): boolean {
        const lower = text.toLowerCase().trim();
        return this.ALL_EXPLICIT_KEYWORDS.some(keyword => {
            const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
            return regex.test(lower);
        });
    }

    /**
     * Resolves the intent deterministically first, then falls back to ML.
     * Returns full arbitration details for logging.
     */
    static resolve(text: string, mlPrediction: MLPrediction | null): IntentResult {
        const lower = text.toLowerCase().trim();
        const hasKeyword = this.hasExplicitKeyword(text);

        // Build arbitration decision for logging
        const decision: ArbitrationDecision = {
            timestamp: Date.now(),
            input: text,
            ruleIntent: null,
            mlIntent: mlPrediction?.intent as IntentType || null,
            mlConfidence: mlPrediction?.confidence || 0,
            finalIntent: 'UNKNOWN',
            finalConfidence: 0,
            decidedBy: 'FALLBACK',
            hasExplicitKeyword: hasKeyword,
            reason: '',
        };

        // 1. Check for Insert (Action detection) - highest priority
        const insertResult = this.detectInsert(text);
        if (insertResult) {
            decision.ruleIntent = 'INSERT';
            decision.finalIntent = 'INSERT';
            decision.finalConfidence = 1.0;
            decision.decidedBy = 'RULE';
            decision.reason = 'Rule-based INSERT detection';
            this.logArbitration(decision);
            return { ...insertResult, hasExplicitKeyword: true };
        }

        // 2. Check Rule-based Query Intents (Deterministic Override)
        const ruleIntent = this.detectRuleBasedIntent(lower);
        decision.ruleIntent = ruleIntent;

        if (ruleIntent) {
            decision.finalIntent = ruleIntent;
            decision.finalConfidence = 1.0;
            decision.decidedBy = 'RULE';
            decision.reason = `Keyword match for ${ruleIntent}`;
            this.logArbitration(decision);

            return {
                intent: ruleIntent,
                confidence: 1.0,
                source: 'RULE',
                hasExplicitKeyword: true,
                slots: mlPrediction?.slots ? this.mapMLSlots(mlPrediction.slots) : {},
                rawText: text
            };
        }

        // 3. Fallback to ML (if confident enough)
        if (mlPrediction && mlPrediction.confidence > 0.6) {
            decision.finalIntent = mlPrediction.intent as IntentType;
            decision.finalConfidence = mlPrediction.confidence;
            decision.decidedBy = 'ML';
            decision.reason = hasKeyword
                ? 'ML prediction with explicit keyword'
                : 'ML prediction (no explicit keyword - cannot lock)';
            this.logArbitration(decision);

            return {
                intent: mlPrediction.intent as IntentType,
                confidence: mlPrediction.confidence,
                source: 'ML',
                hasExplicitKeyword: hasKeyword,
                slots: this.mapMLSlots(mlPrediction.slots),
                rawText: text
            };
        }

        // 4. Default to UNKNOWN (never silently LIST)
        decision.finalIntent = 'UNKNOWN';
        decision.finalConfidence = 0;
        decision.decidedBy = 'FALLBACK';
        decision.reason = 'No rule match, ML confidence too low';
        this.logArbitration(decision);

        return {
            intent: 'UNKNOWN',
            confidence: 0.0,
            source: 'RULE',
            hasExplicitKeyword: false,
            slots: mlPrediction?.slots ? this.mapMLSlots(mlPrediction.slots) : {},
            rawText: text
        };
    }

    private static detectInsert(text: string): IntentResult | null {
        const lower = text.toLowerCase().trim();

        // Regex for Amount: Matches 50, 50.5, 50.00, $50, ₹50
        const amountMatch = lower.match(/(?:^|\s|₹|\$)(\d+(?:\.\d{1,2})?)(?:\s|$)/);

        if (!amountMatch) return null;

        const amountVal = parseFloat(amountMatch[1]);

        // Safety: Avoid matching "2024" or "2025" as amount IF no currency symbol is used
        const hasCurrency = lower.includes('$') || lower.includes('₹');
        if (!hasCurrency && amountVal >= 1900 && amountVal <= 2100 && Number.isInteger(amountVal)) {
            if (lower.includes(`in ${amountVal}`) || lower.includes(`since ${amountVal}`) || lower.includes(`from ${amountVal}`) || lower.includes(`year ${amountVal}`)) {
                return null;
            }
            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            if (months.some(m => lower.includes(m))) {
                return null;
            }
        }

        // Keywords that strongly suggest INSERT
        const isInsertAction = lower.includes('spent') || lower.includes('paid') || lower.includes('bought') || lower.includes('add');

        // Keywords that strongly suggest QUERY
        const isQuery = Object.values(this.KEYWORDS).some(arr => arr.some(k => lower.includes(k)));

        if (isQuery && !isInsertAction) return null;

        if (isInsertAction || !isQuery) {
            let clean = lower.replace(amountMatch[0].trim(), '').trim();
            clean = clean.replace(/^(i\s+)?(spend|spent|paid|bought|add)(\s+on|\s+for)?/g, '');
            clean = clean.replace(/\s+(on|for|at)$/, '');
            // Strip any surrounding quotes from the cleaned note
            clean = clean.replace(/^["']|["']$/g, '').trim();

            if (clean.length > 0) {
                return {
                    intent: 'INSERT',
                    confidence: 1.0,
                    source: 'RULE',
                    hasExplicitKeyword: true,
                    slots: {
                        amount: amountVal,
                        note: clean
                    },
                    rawText: text
                };
            }
        }

        return null;
    }

    private static detectRuleBasedIntent(lower: string): IntentType | null {
        // Order: Specific > General
        if (this.matches(lower, this.KEYWORDS.MAX)) return 'MAX';
        if (this.matches(lower, this.KEYWORDS.MIN)) return 'MIN';
        if (this.matches(lower, this.KEYWORDS.AVG)) return 'AVG';
        if (this.matches(lower, this.KEYWORDS.COUNT)) return 'COUNT';
        if (this.matches(lower, this.KEYWORDS.SUM)) return 'SUM';
        if (this.matches(lower, this.KEYWORDS.LIST)) return 'LIST';

        return null;
    }

    private static matches(text: string, keywords: string[]): boolean {
        return keywords.some(k => text.includes(k));
    }

    private static mapMLSlots(mlSlots: any): any {
        const res: any = {};
        if (mlSlots?.category) res.category = mlSlots.category;
        if (mlSlots?.date) res.date = mlSlots.date;
        if (mlSlots?.subCategory) res.subCategory = mlSlots.subCategory;
        if (mlSlots?.type) res.type = mlSlots.type;
        return res;
    }

    /**
     * Detect if text represents a strong intent signal that can START a new conversation.
     * Requires BOTH: action detection AND explicit keyword.
     */
    static detectStrongIntent(text: string): { isStrong: boolean; intent: IntentType | null; hasKeyword: boolean } {
        const lower = text.toLowerCase().trim();
        const hasKeyword = this.hasExplicitKeyword(text);

        // 1. Is it an Insert?
        if (this.detectInsert(text)) {
            return { isStrong: true, intent: 'INSERT', hasKeyword: true };
        }

        // 2. Is it a Rule-based Query (e.g. "List", "Total")?
        const ruleIntent = this.detectRuleBasedIntent(lower);
        if (ruleIntent) {
            return { isStrong: true, intent: ruleIntent, hasKeyword: true };
        }

        // 3. High confidence ML BUT no explicit keyword = NOT strong enough to lock
        // This prevents "food expenses" from locking to LIST
        return { isStrong: false, intent: null, hasKeyword: hasKeyword };
    }

    /**
     * Log arbitration decision for debugging
     */
    private static logArbitration(decision: ArbitrationDecision): void {
        console.log('┌─────────────────────────────────────────────────');
        console.log(`│ 🔍 Intent Arbitration: "${decision.input.substring(0, 40)}${decision.input.length > 40 ? '...' : ''}"`);
        console.log('├─────────────────────────────────────────────────');
        console.log(`│ Rule Intent:    ${decision.ruleIntent || 'none'}`);
        console.log(`│ ML Intent:      ${decision.mlIntent || 'none'} (${(decision.mlConfidence * 100).toFixed(0)}%)`);
        console.log(`│ Has Keyword:    ${decision.hasExplicitKeyword ? 'YES' : 'NO'}`);
        console.log('├─────────────────────────────────────────────────');
        console.log(`│ ✓ Final:        ${decision.finalIntent} (${decision.decidedBy})`);
        console.log(`│ 📝 Reason:      ${decision.reason}`);
        console.log('└─────────────────────────────────────────────────');
    }
}
