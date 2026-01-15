import { useState, useCallback, useEffect } from 'react';
import { all, run, first } from '../db/sqlite';
import { generateDueFromRecurringRules } from '../services/RecurrenceEngine';
import { getNextDatesFromCron } from '../utils/cronHelpers';
import { TemplateRepo } from '../db/repositories/TemplateRepo';

export function useDebugLogic() {
    const [rules, setRules] = useState<any[]>([]);
    const [uncategorized, setUncategorized] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const r = await all('SELECT * FROM recurring_rules');
            setRules(r || []);

            const u = await all('SELECT * FROM transactions WHERE categoryId IS NULL');
            setUncategorized(u || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteRule = useCallback(async (ruleId: string) => {
        try {
            await run('DELETE FROM templates WHERE recurring_rule_id = ?', [ruleId]);
            await run('DELETE FROM recurring_rules WHERE id = ?', [ruleId]);
            await loadData();
        } catch (e) {
            console.error('Failed to delete rule', e);
        }
    }, [loadData]);

    const handleRecalculate = useCallback(async () => {
        setLoading(true);
        try {
            const count = await generateDueFromRecurringRules();
            console.log(`Generated ${count} transactions`);
            await loadData();
        } catch (e) {
            console.error('Failed to recalculate', e);
        } finally {
            setLoading(false);
        }
    }, [loadData]);

    const recalculateRuleNextDate = useCallback(async (rule: any) => {
        try {
            const lastTxn: { createdAt: number } | null = await first(
                'SELECT MAX(createdAt) as createdAt FROM transactions WHERE recurring_rule_id = ?',
                [rule.id]
            );

            const startAt = lastTxn?.createdAt ? lastTxn.createdAt + 1000 : rule.created_at;

            console.log(`Recalculating rule ${rule.id}. StartAt=${startAt}`);

            const future = getNextDatesFromCron({
                cron: rule.cron_expression,
                tz: rule.timezone ?? 'UTC',
                startAt: startAt,
                maxCount: 1,
            });

            if (future.length > 0) {
                console.log(`New Next Date: ${new Date(future[0]).toISOString()}`);
                await TemplateRepo.updateRecurringRuleNextDate(rule.id, future[0]);
                await loadData();
            } else {
                console.warn('No future date found for rule', rule.id);
            }
        } catch (e) {
            console.error('Failed to recalculate rule next date', e);
        }
    }, [loadData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        rules,
        uncategorized,
        loading,
        loadData,
        deleteRule,
        handleRecalculate,
        recalculateRuleNextDate,
    };
}
