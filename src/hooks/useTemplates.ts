import { useCallback, useEffect, useState } from 'react';
import { TemplateRepo } from '../db/repositories/TemplateRepo';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import type { Template, RecurringRule } from '../db/models';
import parser, { CronExpressionParser } from 'cron-parser';

export default function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await TemplateRepo.listTemplates();
      setTemplates(rows || []);
    } catch (err) {
      console.error('useTemplates.load', err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTemplate = useCallback(
    async (payload: {
      name: string;
      template: Record<string, any>;
      is_recurring?: boolean;
      recurring_rule?: {
        cronExpression: string;
        timezone?: string;
        humanReadable?: string | null;
        nextDate?: number;
        endDate?: number | null;
      } | null;
    }) => {
      // create recurring rule first if requested
      let recurringRuleId: string | null = null;
      if (payload.is_recurring && payload.recurring_rule) {
        recurringRuleId = await TemplateRepo.createRecurringRule({
          cronExpression: payload.recurring_rule.cronExpression,
          timezone: payload.recurring_rule.timezone ?? 'UTC',
          template: payload.template,
          nextDate: payload.recurring_rule.nextDate ?? Date.now(),
          endDate: payload.recurring_rule.endDate ?? null,
          humanReadable: payload.recurring_rule.humanReadable ?? null,
          enabled: true,
        });
      }

      const id = await TemplateRepo.createTemplate({
        name: payload.name,
        template: payload.template,
        is_recurring: payload.is_recurring ?? false,
        recurring_rule_id: recurringRuleId,
      });
      await load();
      return id;
    },
    [load],
  );

  const updateTemplate = useCallback(
    async (
      id: string,
      patch: Partial<Template> & { recurring_rule_patch?: Partial<RecurringRule> | null },
    ) => {
      // If recurring_rule_patch present - update rule
      if (patch.recurring_rule_patch && (patch as any).recurring_rule_id) {
        const rid = (patch as any).recurring_rule_id as string;
        // we simply allow TemplateRepo to expose a method; if not exist you can implement it.
        if ((TemplateRepo as any).updateRecurringRule) {
          await (TemplateRepo as any).updateRecurringRule(rid, (patch as any).recurring_rule_patch);
        }
      }

      // update template row
      const updatePatch: any = {};
      if (patch.name !== undefined) updatePatch.name = patch.name;
      if (patch.template_json !== undefined) updatePatch.template_json = patch.template_json;
      if (patch.is_recurring !== undefined) updatePatch.is_recurring = patch.is_recurring;
      if ((patch as any).recurring_rule_id !== undefined)
        updatePatch.recurring_rule_id = (patch as any).recurring_rule_id;

      if (Object.keys(updatePatch).length > 0) {
        await TemplateRepo.updateTemplate(id, updatePatch);
      }
      await load();
    },
    [load],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      await TemplateRepo.deleteTemplate(id);
      await load();
    },
    [load],
  );

  const instantiateTemplate = useCallback(async (id: string) => {
    // fetch template, create a transaction from template.template_json
    const tpl = await TemplateRepo.findTemplateById(id);
    if (!tpl) throw new Error('Template not found');
    const obj = JSON.parse(tpl.template_json);
    
    // Resolve merchant to payeeId if present
    if (obj.merchant && !obj.payeeId) {
       // We need to cast TransactionRepo to any or ensure addPayee is available on the imported object.
       // TransactionRepo is imported. Let's check if addPayee is exported.
       // It is exported in TransactionRepo.ts.
       const payee = await TransactionRepo.addPayee({ name: obj.merchant });
       obj.payeeId = payee.id;
    }

    // ensure createdAt
    const now = Date.now();
    const txnPayload = {
      ...obj,
      createdAt: now,
      updatedAt: now,
    };
    await TransactionRepo.create(txnPayload);
    // do not reload templates list (templates remain unchanged)
  }, []);

  const getRecurringSchedule = useCallback(async (start: Date, end: Date) => {
    // 1. fetch all templates
    const allTemplates = await TemplateRepo.listTemplates();
    
    // 2. Filter for recurring
    const recurring = allTemplates.filter(t => t.is_recurring && t.cron_expression && t.recurring_rule_id);

    const schedule: Array<{
      date: Date;
      templateName: string;
      amount: number;
      status: 'executed' | 'missed' | 'pending';
      templateId: string;
      transactionId?: string;
      recurringRuleId?: string;
      templateJson?: string;
    }> = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Pre-fetch transactions for all rules in parallel
    const ruleIds = recurring.map(t => t.recurring_rule_id!);
    
    // Check if repo has the new method (it should)
    let transactions: any[] = [];
    const startMs = start.getTime() - 86400000; 
    const endMs = end.getTime() + 86400000;
    transactions = await TransactionRepo.findForRulesInRange(ruleIds, startMs, endMs);
    

    const txnsMap: Record<string, any[]> = {};
    // Group by rule ID
    transactions.forEach(t => {
        if (t.recurring_rule_id) {
            if (!txnsMap[t.recurring_rule_id]) txnsMap[t.recurring_rule_id] = [];
            txnsMap[t.recurring_rule_id].push(t);
        }
    });

    for (const t of recurring) {
      const rid = t.recurring_rule_id!;
      const executed = txnsMap[rid] || [];
      
      try {
        // Pre-parse amount from template
        let baseAmount = 0;
        try {
          const access = JSON.parse(t.template_json);
          baseAmount = access.amount || 0;
        } catch {}

        const options = {
          currentDate: start,
          endDate: end,
          iterator: true,
          tz: t.timezone || 'UTC'
        };
        const interval = CronExpressionParser.parse(t.cron_expression!, options);

        while (true) {
          try {
            const obj = interval.next();
            const date = obj.toDate();
            
            // Recurrence Logic: "Before Creation" Rule
            // If the generated date is before the rule/template creation date,
            // we should generally ignore it, UNLESS an execution actually exists for it.
            // (This matches RecurrenceCalendarModal logic)
            const createdLimit = t.created_at || 0;
            // helper to check if date is strictly before creation (ignoring time if desired, but crude check is fine)
            // RecurrenceCalendarModal checks 'date.getTime() < template.created_at' strictly.
            const isPreCreation = date.getTime() < createdLimit;

            const executedTxn = executed.find(txn => {
                const txnDate = new Date(txn.createdAt);
                return txnDate.getFullYear() === date.getFullYear() &&
                       txnDate.getMonth() === date.getMonth() && 
                       txnDate.getDate() === date.getDate();
            });

            // SKIP if pre-creation and NOT executed
            if (isPreCreation && !executedTxn) {
                // However, we must verify if we should checking against t.created_at or rule.created_at?
                // RecurrenceCalendarModal uses `template.created_at`.
                // Assuming consistency, we validly skip.
                continue; 
            }

            let status: 'executed' | 'missed' | 'pending' = 'pending';
            let transactionId: string | undefined = undefined;

            if (executedTxn) {
                status = 'executed';
                transactionId = executedTxn.id;
            } else {
                if (date < todayStart) {
                    status = 'missed';
                } else {
                    status = 'pending';
                }
            }

            schedule.push({
              date,
              templateName: t.name,
              amount: baseAmount,
              status,
              templateId: t.id,
              transactionId,
              recurringRuleId: rid,
              templateJson: t.template_json,
            });
          } catch (e) {
            break;
          }
        }
      } catch (err) {
        console.warn('Error processing template schedule', t.name, err);
      }
    }

    // Sort by date
    schedule.sort((a, b) => a.date.getTime() - b.date.getTime());
    return schedule;
  }, []);

  return {
    templates,
    loading,
    load,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    instantiateTemplate,
    getRecurringSchedule,
  } as const;
}
