import { MLService } from './MLService';
import { IntentResolver, IntentType } from '../utils/IntentResolver';
import { ConversationContext } from './chat/ConversationContext';
import { buildFiltersFromSlots } from './chat/FilterBuilder';
import { ActionHandlers } from './chat/ActionHandlers';
import { detectFollowUp, FollowUpSignal } from './chat/FollowUpDetector';
import { mergeSlots, SlotMergeResult } from './chat/SlotValidator';
import { ResponseBuilder, ChatResponse, ResponseFormat } from './chat/ResponseBuilder';

// Re-export types for external use
export type { ChatResponse, ResponseFormat };

export interface ChatMessage {
    id: string;
    text: string;
    format: ResponseFormat;
    sender: 'user' | 'bot';
    timestamp: number;
}

// Risk-adjusted confidence thresholds per intent type
const CONFIDENCE_THRESHOLDS: Record<IntentType, { execute: number; confirm: number }> = {
    LIST: { execute: 0.70, confirm: 0.50 },
    SUM: { execute: 0.75, confirm: 0.55 },
    COUNT: { execute: 0.75, confirm: 0.55 },
    AVG: { execute: 0.75, confirm: 0.55 },
    MAX: { execute: 0.75, confirm: 0.55 },
    MIN: { execute: 0.75, confirm: 0.55 },
    INSERT: { execute: 0.95, confirm: 0.80 },
    UNKNOWN: { execute: 1.0, confirm: 1.0 },
};

export const ChatService = {

    /**
     * Get the initial welcome message
     */
    getWelcomeMessage(): ChatResponse {
        return ResponseBuilder.welcome();
    },

    async processMessage(text: string): Promise<ChatResponse> {
        const jobId = ConversationContext.incrementJobId();
        const trimmed = text.toLowerCase().trim();

        // === Pending Insert Handling ===
        // Check if we have a pending insert awaiting response
        if (ConversationContext.hasPendingInsert()) {
            const pendingResponse = await ActionHandlers.handlePendingInsertResponse(text);
            if (pendingResponse) {
                return pendingResponse;
            }
            // If not handled, continue with normal flow
        }

        // === Greeting Detection ===
        if (['hi', 'hello', 'hey', 'help', 'start'].includes(trimmed)) {
            ConversationContext.reset();
            return this.getWelcomeMessage();
        }

        // === Reset Commands ===
        if (trimmed === 'reset' || trimmed === 'start over' || trimmed === 'clear') {
            ConversationContext.reset();
            return ResponseBuilder.plain(
                `✨ Fresh start! What would you like to know about your expenses?`,
                'UNKNOWN'
            );
        }

        // === Debug Command ===
        if (trimmed === 'debug') {
            console.log('[ChatService] Debug state:', ConversationContext.getDebugState());
            return ResponseBuilder.plain(`🔧 Debug info logged to console.`, 'UNKNOWN');
        }

        // === Context Health Check (Decay if stale) ===
        ConversationContext.maybeDecay();
        ConversationContext.incrementTurnCount();

        // === ML Prediction ===
        const mlPrediction = await MLService.predict(text);

        if (ConversationContext.isSuperseded(jobId)) {
            console.log(`[ChatService] Job ${jobId} superseded. Ignoring.`);
            return ResponseBuilder.plain('', 'UNKNOWN');
        }

        // === Follow-up Detection (Dialog State) ===
        const followUp: FollowUpSignal = detectFollowUp(text);
        console.log('[ChatService] Follow-up detection:', followUp);

        // === Intent Resolution (Semantic) ===
        const resolution = IntentResolver.resolve(text, mlPrediction);
        console.log('[ChatService] Intent resolution:', JSON.stringify(resolution, null, 2));

        // === Strong Intent Detection ===
        const strongIntent = IntentResolver.detectStrongIntent(text);

        // === Intent Arbitration ===
        let activeIntent: IntentType;
        let shouldLock = false;

        if (followUp.isFollowUp && ConversationContext.hasActiveIntent()) {
            activeIntent = ConversationContext.getIntent();
            console.log(`[ChatService] Follow-up detected → Using locked intent: ${activeIntent}`);
        } else if (strongIntent.isStrong && strongIntent.hasKeyword) {
            activeIntent = resolution.intent;
            shouldLock = true;
            if (followUp.type !== 'CORRECTION') {
                ConversationContext.reset();
            }
            console.log(`[ChatService] Strong intent with keyword → Locking to: ${activeIntent}`);
        } else if (resolution.intent === 'UNKNOWN') {
            return this.handleUnknownIntent(text, followUp);
        } else if (!ConversationContext.hasActiveIntent()) {
            activeIntent = resolution.intent;
            if (strongIntent.hasKeyword && resolution.confidence >= CONFIDENCE_THRESHOLDS[activeIntent].execute) {
                shouldLock = true;
            }
            console.log(`[ChatService] No active context → Using: ${activeIntent} (lock: ${shouldLock})`);
        } else {
            if (resolution.confidence > 0.85 && strongIntent.hasKeyword) {
                activeIntent = resolution.intent;
                shouldLock = true;
                console.log(`[ChatService] High conf + keyword → Switching to: ${activeIntent}`);
            } else {
                activeIntent = ConversationContext.getIntent();
                console.log(`[ChatService] Ambiguous signal → Keeping: ${activeIntent}`);
            }
        }

        // === INSERT Handling ===
        if (activeIntent === 'INSERT') {
            return await ActionHandlers.handleInsert(resolution.slots);
        }

        // === Slot Processing ===
        const newFilters = await buildFiltersFromSlots(resolution.slots, text);
        const existingFilters = ConversationContext.getFilters();

        const mergeResult: SlotMergeResult = mergeSlots(
            existingFilters,
            newFilters,
            followUp.type === 'CORRECTION'
        );

        // Handle conflicts with friendly message
        if (mergeResult.conflicts.length > 0) {
            const criticalConflicts = mergeResult.conflicts.filter(c => c.isCritical);
            if (criticalConflicts.length > 0) {
                const conflict = criticalConflicts[0];
                return ResponseBuilder.plain(
                    `🔄 Just to confirm — switching from **${conflict.existing}** to **${conflict.incoming}**?\n\n` +
                    `Reply "yes" to confirm, or tell me the correct value.`,
                    'UNKNOWN'
                );
            }
        }

        if (mergeResult.overwrites.length > 0) {
            console.log('[ChatService] Slot overwrites:', mergeResult.overwrites);
        }

        if (Object.keys(mergeResult.merged).length > 0) {
            ConversationContext.updateFilters(mergeResult.merged);
        }

        if (shouldLock && activeIntent !== 'UNKNOWN') {
            ConversationContext.lockIntent(
                activeIntent,
                resolution.confidence,
                resolution.source
            );
        }

        // === Execute Query ===
        const finalFilters = ConversationContext.getFilters();

        // Human-readable log
        const dateRange = finalFilters.startDate && finalFilters.endDate
            ? `${new Date(finalFilters.startDate).toLocaleDateString()} - ${new Date(finalFilters.endDate).toLocaleDateString()}`
            : 'all time';
        console.log(`[ChatService] Executing ${activeIntent} | ${dateRange}`);

        return await ActionHandlers.execute(activeIntent, finalFilters);
    },

    /**
     * Handle UNKNOWN intent with friendly clarification
     */
    handleUnknownIntent(text: string, followUp: FollowUpSignal): ChatResponse {
        if (ConversationContext.hasActiveIntent()) {
            console.log('[ChatService] UNKNOWN + context → treating as slot refinement');
            const lockedIntent = ConversationContext.getIntent();

            const intentNames: Record<IntentType, string> = {
                'LIST': 'expense list',
                'SUM': 'spending total',
                'MAX': 'biggest expense search',
                'MIN': 'smallest expense search',
                'COUNT': 'transaction count',
                'AVG': 'average calculation',
                'INSERT': 'expense entry',
                'UNKNOWN': 'query',
            };

            return ResponseBuilder.continueContext(intentNames[lockedIntent] || 'query');
        } else {
            console.log('[ChatService] UNKNOWN + no context → asking clarification');
            return ResponseBuilder.clarification();
        }
    },
};
