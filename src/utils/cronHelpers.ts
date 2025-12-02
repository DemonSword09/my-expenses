// src/utils/cronHelpers.ts
import { CronExpressionParser } from 'cron-parser';

/**
 * getNextDatesFromCron
 * - cron: cron expression string
 * - tz: IANA timezone (e.g., 'Asia/Kolkata')
 * - startAt: epoch ms start point (inclusive)
 * - stopAt: epoch ms stop point (inclusive) - if provided stop when next > stopAt
 * - maxCount: maximum number of dates to return
 *
 * Returns array of epoch milliseconds (UTC).
 */
export function getNextDatesFromCron(opts: {
  cron: string;
  tz?: string;
  startAt?: number;
  stopAt?: number;
  maxCount?: number;
}): number[] {
  const { cron, tz = 'UTC', startAt = Date.now(), stopAt, maxCount = 10 } = opts;
  const results: number[] = [];

  // parse using cron-parser with timezone handling
  try {
    // cron-parser accepts a 'tz' option in newer versions; we also use date-fns-tz to convert start point
    const options: any = {
      currentDate: new Date(startAt),
      tz,
      iterator: true,
    };

    const interval = CronExpressionParser.parse(cron, options);

    while (results.length < maxCount) {
      const obj = interval.next();
      const nextDate = obj.getTime();

      // stop if beyond stopAt
      if (stopAt && nextDate > stopAt) break;

      results.push(nextDate);
    }
  } catch (err) {
    console.error('cronHelpers: failed to parse cron', cron, err);
    // return empty array on parse failure — caller should handle
  }

  return results;
}
