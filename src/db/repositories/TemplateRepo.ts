// src/db/repositories/TemplateRepo.ts
import { run, all, first } from '../sqlite'; // adapt to your helpers
import type { Template, RecurringRule } from '../models';
import { uuidSync } from '@src/utils/uuid';

export const TemplateRepo = {
  async createTemplate(payload: {
    name: string;
    template: Record<string, any>;
    is_recurring?: boolean;
    recurring_rule_id?: string | null;
  }): Promise<string> {
    const id = uuidSync();
    const now = Date.now();
    const stmt = `INSERT INTO templates (id, name, template_json, is_recurring, recurring_rule_id, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await run(stmt, [
      id,
      payload.name,
      JSON.stringify(payload.template),
      payload.is_recurring ? 1 : 0,
      payload.recurring_rule_id ?? null,
      now,
      now,
    ]);
    return id;
  },

  async listTemplates(): Promise<Template[]> {
    // Join with recurring_rules to get next_date etc.
    const sql = `
      SELECT t.*, 
             r.next_date, 
             r.human_readable, 
             r.cron_expression, 
             r.timezone
      FROM templates t
      LEFT JOIN recurring_rules r ON t.recurring_rule_id = r.id
      ORDER BY t.created_at DESC
    `;
    const rows = await all<Template>(sql);
    return rows || [];
  },

  async findTemplateById(id: string): Promise<Template | null> {
    return (await first<Template>(`SELECT * FROM templates WHERE id = ?`, [id])) ?? null;
  },

  async updateTemplate(id: string, patch: Partial<Omit<Template, 'id' | 'created_at'>>) {
    const now = Date.now();
    const fields: string[] = [];
    const values: any[] = [];
    if (patch.name !== undefined) {
      fields.push('name = ?');
      values.push(patch.name);
    }
    if (patch.template_json !== undefined) {
      fields.push('template_json = ?');
      values.push(patch.template_json);
    }
    if (patch.is_recurring !== undefined) {
      fields.push('is_recurring = ?');
      values.push(patch.is_recurring);
    }
    if (patch.recurring_rule_id !== undefined) {
      fields.push('recurring_rule_id = ?');
      values.push(patch.recurring_rule_id);
    }
    if (fields.length === 0) return;
    fields.push('updated_at = ?');
    values.push(now);
    const sql = `UPDATE templates SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await run(sql, values);
  },

  async deleteTemplate(id: string) {
    const template = await this.findTemplateById(id);
    await run(`DELETE FROM templates WHERE id = ?`, [id]);
    if (template?.recurring_rule_id) {
      await run(`DELETE FROM recurring_rules WHERE id = ?`, [template.recurring_rule_id]);
    }
  },

  // Recurring rule helpers
  async createRecurringRule(payload: {
    cronExpression: string;
    timezone?: string | null;
    template: Record<string, any>;
    nextDate: number;
    endDate?: number | null;
    humanReadable?: string | null;
    enabled?: boolean;
  }): Promise<string> {
    const id = uuidSync();
    const now = Date.now();
    await run(
      `INSERT INTO recurring_rules (id, cron_expression, timezone, human_readable, template_json, next_date, end_date, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.cronExpression,
        payload.timezone ?? 'UTC',
        payload.humanReadable ?? null,
        JSON.stringify(payload.template),
        payload.nextDate,
        payload.endDate ?? null,
        payload.enabled ? 1 : 1,
        now,
        now,
      ],
    );
    return id;
  },

  async listDueRecurringRules(nowMs: number, limit = 100): Promise<RecurringRule[]> {
    // fetch enabled rules with next_date <= now
    const rows = await all<RecurringRule>(
      `SELECT * FROM recurring_rules WHERE enabled = 1 AND next_date <= ? ORDER BY next_date ASC LIMIT ?`,
      [nowMs, limit],
    );
    return rows || [];
  },

  async updateRecurringRuleNextDate(id: string, nextDate: number) {
    await run(`UPDATE recurring_rules SET next_date = ?, updated_at = ? WHERE id = ?`, [
      nextDate,
      Date.now(),
      id,
    ]);
  },

  async findRecurringRuleById(id: string) {
    return (await first<RecurringRule>(`SELECT * FROM recurring_rules WHERE id = ?`, [id])) ?? null;
  },

  async disableRecurringRule(id: string) {
    await run(`UPDATE recurring_rules SET enabled = 0, updated_at = ? WHERE id = ?`, [
      Date.now(),
      id,
    ]);
  },

  async updateRecurringRule(id: string, patch: Partial<RecurringRule>) {
    const fields: string[] = [];
    const values: any[] = [];
    if (patch.cron_expression !== undefined) {
      fields.push('cron_expression = ?');
      values.push(patch.cron_expression);
    }
    if (patch.timezone !== undefined) {
      fields.push('timezone = ?');
      values.push(patch.timezone);
    }
    if (patch.human_readable !== undefined) {
      fields.push('human_readable = ?');
      values.push(patch.human_readable);
    }
    if (patch.next_date !== undefined) {
      fields.push('next_date = ?');
      values.push(patch.next_date);
    }
    if (patch.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(patch.enabled);
    }
    
    if (fields.length === 0) return;
    fields.push('updated_at = ?');
    values.push(Date.now());
    
    const sql = `UPDATE recurring_rules SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await run(sql, values);
  },
};
