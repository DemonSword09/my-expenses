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
    const recurring = allTemplates.filter(t => t.is_recurring && t.cron_expression);

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

    // optimization: fetch all executed transactions for these rules? 
    // Or for each rule, fetch executed. Since number of rules is likely small, sequential or parallel fetch is fine.
    
    for (const t of recurring) {
      if (!t.recurring_rule_id) continue;
      
      try {
        // Fetch executed txns for this rule
        const executed = await TransactionRepo.findByRecurringRule(t.recurring_rule_id);
        
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
            
            // Check if executed on this date (simple day match)
            const executedTxn = executed.find(txn => {
                const txnDate = new Date(txn.createdAt);
                return txnDate.getFullYear() === date.getFullYear() &&
                       txnDate.getMonth() === date.getMonth() && 
                       txnDate.getDate() === date.getDate();
            });

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

            // Extract amount from template_json
            let amount = 0;
            try {
              const access = JSON.parse(t.template_json);
              amount = access.amount || 0;
            } catch {}

            schedule.push({
              date,
              templateName: t.name,
              amount,
              status,
              templateId: t.id,
              transactionId,
              recurringRuleId: t.recurring_rule_id,
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
