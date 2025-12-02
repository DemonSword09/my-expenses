// src/hooks/useTemplates.ts
import { useCallback, useEffect, useState } from 'react';
import { TemplateRepo } from '../db/repositories/TemplateRepo';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import type { Template, RecurringRule } from '../db/models';

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
      description?: string | null;
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
        description: payload.description ?? null,
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
      if (patch.description !== undefined) updatePatch.description = patch.description;
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

  return {
    templates,
    loading,
    load,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    instantiateTemplate,
  } as const;
}
