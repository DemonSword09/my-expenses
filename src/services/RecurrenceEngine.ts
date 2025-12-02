// src/services/RecurrenceEngine.ts
import cronParser from 'cron-parser';
import { TemplateRepo } from '../db/repositories/TemplateRepo';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { getNextDatesFromCron } from '../utils/cronHelpers';
import type { RecurringRule } from '../db/models';

/**
 * generateDueFromRecurringRules
 * - finds rules whose next_date <= now
 * - for each rule, generate instances up to now (or until end_date)
 * - create transactions in a transaction (SQLite) to ensure atomicity
 * - update rule.next_date to the next future date after now
 *
 * options:
 *  - capPerRule: max instances to generate per rule (safety)
 *  - globalCap: max total instances generated in one run (safety)
 */
export async function generateDueFromRecurringRules(opts?: {
  capPerRule?: number;
  globalCap?: number;
}) {
  const capPerRule = opts?.capPerRule ?? 100;
  const globalCap = opts?.globalCap ?? 500;

  const now = Date.now();
  const dueRules = await TemplateRepo.listDueRecurringRules(now, 500);

  let generatedCount = 0;

  for (const rule of dueRules) {
    if (generatedCount >= globalCap) break;

    // parse template payload
    const templateObj = JSON.parse(rule.template_json);

    // compute due dates from rule.next_date up to (now) but limited by capPerRule and end_date
    const nextDates = getNextDatesFromCron({
      cron: rule.cron_expression,
      tz: rule.timezone ?? 'UTC',
      startAt: rule.next_date,
      stopAt: Math.min(now, rule.end_date ?? now),
      maxCount: Math.min(capPerRule, globalCap - generatedCount),
    });

    if (nextDates.length === 0) {
      // nothing to create; try to compute a future next date (one occurrence after now)
      try {
        const future = getNextDatesFromCron({
          cron: rule.cron_expression,
          tz: rule.timezone ?? 'UTC',
          startAt: now + 1000,
          maxCount: 1,
        });
        if (future.length > 0) {
          await TemplateRepo.updateRecurringRuleNextDate(rule.id, future[0]);
        }
      } catch (err) {
        console.error('recurrence: failed to compute next date', err);
      }
      continue;
    }

    // Create transactions in a DB transaction - use your sqlite transaction helper
    // PSEUDO: beginTransaction(); create each transaction; commit();
    // Replace with your own db transaction mechanism.
    try {
      // IMPORTANT: ensure TransactionRepo.create runs inside a single SQLite transaction
      // If your TransactionRepo supports begin/commit, use that. Otherwise rely on default atomicity.
      for (const dt of nextDates) {
        if (generatedCount >= globalCap) break;

        // build transaction data from templateObj
        const txnPayload = {
          ...templateObj,
          createdAt: dt,
          updatedAt: dt,
          recurring_rule_id: rule.id, // optional backlink
        };

        // ensure required fields exist (amount, transaction_type)
        if (typeof txnPayload.amount !== 'number') {
          console.warn('recurrence: template missing amount', rule.id);
          continue;
        }

        await TransactionRepo.create(txnPayload);
        generatedCount += 1;
      }

      // set rule.next_date to the first date after 'now' (or last generated + next)
      try {
        const future = getNextDatesFromCron({
          cron: rule.cron_expression,
          tz: rule.timezone ?? 'UTC',
          startAt: Math.max(now + 1000, rule.next_date + 1),
          maxCount: 1,
        });
        if (future.length > 0) {
          await TemplateRepo.updateRecurringRuleNextDate(rule.id, future[0]);
        } else {
          // no future date (e.g., end_date hit), disable rule
          await TemplateRepo.disableRecurringRule(rule.id);
        }
      } catch (err) {
        console.error('recurrence: failed updating next_date', err);
      }
    } catch (err) {
      console.error('recurrence: failed to create instances for rule', rule.id, err);
      // continue to next rule
    }
  }

  return generatedCount;
}
