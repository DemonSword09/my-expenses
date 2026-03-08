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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateObj: any = JSON.parse(rule.template_json);

    // Resolve merchant to payeeId if present
    if (templateObj.merchant && !templateObj.payeeId) {
      try {
        const payee = await TransactionRepo.addPayee({ name: templateObj.merchant });
        templateObj.payeeId = payee.id;
      } catch (err) {
        console.warn('recurrence: failed to resolve payee for rule', rule.id, err);
      }
    }

    // Determine the effective start date for calculating due dates.
    // We prefer the date following the LAST generated transaction to fill any gaps.
    // If no transactions exist, we fall back to rule.created_at.
    // We do NOT rely solely on rule.next_date because it might be out of sync.
    const lastTxn = await TransactionRepo.findLastByRecurringRule(rule.id);
    const effectiveStartAt = lastTxn?.createdAt ? lastTxn.createdAt + 1000 : rule.created_at;

    // compute due dates from effectiveStartAt up to (now) but limited by capPerRule and end_date
    const nextDates = getNextDatesFromCron({
      cron: rule.cron_expression,
      tz: rule.timezone ?? 'UTC',
      startAt: effectiveStartAt,
      stopAt: Math.min(now, rule.end_date ?? now),
      maxCount: Math.min(capPerRule, globalCap - generatedCount),
    });

    if (nextDates.length === 0) {
      // nothing to create; update rule.next_date if it's behind
      try {
        const future = getNextDatesFromCron({
          cron: rule.cron_expression,
          tz: rule.timezone ?? 'UTC',
          startAt: now + 1000,
          maxCount: 1,
        });
        if (future.length > 0 && future[0] > rule.next_date) {
             // Only update if the calculated future is actually ahead.
             // But wait, if we are in this block, it means no transactions were generated up to NOW.
             // It implies we are up to date or the rule is for the future.
             // We can safely fast-forward next_date to the upcoming future date.
             // However, to keep it consistent with our "last transaction" logic, 
             // we should probably just leave next_date as a "hint" or update it.
             // For now, let's update it to the immediate future relative to now, 
             // so the UI shows something reasonable.
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
