import { IntentType } from '../../utils/IntentResolver';

// Intent lock states for the state machine
export type IntentLockState = 'UNLOCKED' | 'LOCKED' | 'DECAYING';

// Metadata about the current intent lock
export interface IntentLock {
    intent: IntentType;
    state: IntentLockState;
    lockedAt: number;
    lockSource: 'RULE' | 'ML' | 'USER_CONFIRM';
    turnCount: number;
    confidence: number;
}

// Context health for decay decisions
export interface ContextHealth {
    age: number;
    turnCount: number;
    coherenceScore: number;
}

// Pending insert data for clarification flow
export interface PendingInsert {
    amount: number;
    note?: string;
    categoryId?: string;
    payeeId?: string;
    templateId?: string;  // If cloning from existing transaction
    awaitingConfirmation: boolean;
    awaitingCategory: boolean;
}

interface ChatContext {
    intentLock?: IntentLock;
    pendingInsert?: PendingInsert;
    filters: {
        categoryId?: string;
        categoryIds?: string[];
        accountId?: string;
        payeeId?: string;
        startDate?: number;
        endDate?: number;
        limit?: number;
    };
    lastUpdated: number;
}

// Decay thresholds
const DECAY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const DECAY_TURN_THRESHOLD = 10;
const UNLOCK_TURN_THRESHOLD = 5;

class ConversationContextManager {
    private context: ChatContext = { filters: {}, lastUpdated: Date.now() };
    private jobId = 0;

    reset(): void {
        this.context = { filters: {}, lastUpdated: Date.now() };
        console.log('[Context] Reset');
    }

    // === Intent Lock State Machine ===

    hasActiveIntent(): boolean {
        return (
            this.context.intentLock !== undefined &&
            this.context.intentLock.state !== 'UNLOCKED' &&
            this.context.intentLock.intent !== 'UNKNOWN'
        );
    }

    getIntentLockState(): IntentLockState {
        return this.context.intentLock?.state || 'UNLOCKED';
    }

    lockIntent(
        intent: IntentType,
        confidence: number,
        source: 'RULE' | 'ML' | 'USER_CONFIRM'
    ): void {
        this.context.intentLock = {
            intent,
            state: 'LOCKED',
            lockedAt: Date.now(),
            lockSource: source,
            turnCount: 0,
            confidence,
        };
        this.context.lastUpdated = Date.now();
        console.log(`[Context] Intent LOCKED: ${intent} (source: ${source}, conf: ${confidence.toFixed(2)})`);
    }

    unlockIntent(): void {
        if (this.context.intentLock) {
            console.log(`[Context] Intent UNLOCKED (was: ${this.context.intentLock.intent})`);
            this.context.intentLock.state = 'UNLOCKED';
        }
    }

    getIntent(): IntentType {
        return this.context.intentLock?.intent || 'UNKNOWN';
    }

    getLockedIntent(): IntentType | null {
        if (this.hasActiveIntent()) {
            return this.context.intentLock!.intent;
        }
        return null;
    }

    incrementTurnCount(): void {
        if (this.context.intentLock) {
            this.context.intentLock.turnCount++;
        }
    }

    // === Context Health & Decay ===

    evaluateHealth(): ContextHealth {
        const age = Date.now() - this.context.lastUpdated;
        const turnCount = this.context.intentLock?.turnCount || 0;

        let coherence = 1.0;
        if (age > 5 * 60 * 1000) coherence *= 0.7; // >5 min
        if (turnCount > 5) coherence *= 0.8;

        return { age, turnCount, coherenceScore: coherence };
    }

    maybeDecay(): void {
        if (!this.context.intentLock) return;

        const health = this.evaluateHealth();

        if (health.age > DECAY_TIMEOUT_MS) {
            this.reset();
            console.log('[Context] Auto-reset: timeout');
        } else if (health.turnCount > DECAY_TURN_THRESHOLD) {
            this.context.intentLock.state = 'DECAYING';
            console.log('[Context] Intent state → DECAYING (stale turns)');
        } else if (health.turnCount > UNLOCK_TURN_THRESHOLD && this.context.intentLock.state === 'DECAYING') {
            this.unlockIntent();
        }
    }

    // === Filters ===

    updateFilters(newFilters: Partial<ChatContext['filters']>): void {
        this.context.filters = { ...this.context.filters, ...newFilters };
        this.context.lastUpdated = Date.now();
    }

    getFilters(): ChatContext['filters'] {
        return this.context.filters;
    }

    // === Pending Insert ===

    setPendingInsert(pending: PendingInsert): void {
        this.context.pendingInsert = pending;
        this.context.lastUpdated = Date.now();
        console.log('[Context] Pending insert set:', pending);
    }

    getPendingInsert(): PendingInsert | undefined {
        return this.context.pendingInsert;
    }

    hasPendingInsert(): boolean {
        return this.context.pendingInsert !== undefined;
    }

    clearPendingInsert(): void {
        this.context.pendingInsert = undefined;
        console.log('[Context] Pending insert cleared');
    }

    updatePendingInsert(updates: Partial<PendingInsert>): void {
        if (this.context.pendingInsert) {
            this.context.pendingInsert = { ...this.context.pendingInsert, ...updates };
            this.context.lastUpdated = Date.now();
        }
    }

    // === Job ID (for async request handling) ===

    incrementJobId(): number {
        this.jobId++;
        return this.jobId;
    }

    getCurrentJobId(): number {
        return this.jobId;
    }

    isSuperseded(jobId: number): boolean {
        return jobId !== this.jobId;
    }

    // === Debug ===

    getDebugState(): object {
        return {
            intentLock: this.context.intentLock,
            pendingInsert: this.context.pendingInsert,
            filters: this.context.filters,
            lastUpdated: new Date(this.context.lastUpdated).toISOString(),
            health: this.evaluateHealth(),
        };
    }
}

export const ConversationContext = new ConversationContextManager();

