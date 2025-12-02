// src/utils/cronPresets.ts
import { getNextDatesFromCron } from './cronHelpers';

export type RecurrencePreset = 'one-time' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export function timeToHourMinute(time: string) {
  // expects "HH:MM" (24h)
  const [h = '0', m = '0'] = (time || '09:00').split(':');
  const hour = parseInt(h, 10) || 0;
  const minute = parseInt(m, 10) || 0;
  return { hour, minute };
}

/**
 * Build a cron string from preset
 * cron format used: "m h dom mon dow"
 */
export function presetToCron(
  preset: RecurrencePreset,
  time = '09:00',
  opts?: { weekday?: number /*0-6 Sun-Sat*/; dayOfMonth?: number },
) {
  const { hour, minute } = timeToHourMinute(time);
  switch (preset) {
    case 'one-time':
      return null; // no cron
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekdays':
      // Mon-Fri => dow 1-5
      return `${minute} ${hour} * * 1-5`;
    case 'weekly':
      // opts.weekday required: 0-6 (Sun-Sat)
      return `${minute} ${hour} * * ${opts?.weekday ?? 1}`;
    case 'monthly':
      // opts.dayOfMonth required: 1-31
      return `${minute} ${hour} ${opts?.dayOfMonth ?? 1} * *`;
    default:
      return null;
  }
}

/**
 * computeNextDateFromPreset returns a epoch-ms next date given preset/time and tz
 */
export function computeNextFromPreset(
  preset: RecurrencePreset,
  time = '09:00',
  opts?: { weekday?: number; dayOfMonth?: number; tz?: string },
) {
  const cron = presetToCron(preset, time, opts);
  if (!cron) return null;
  const tz = opts?.tz ?? 'UTC';
  const arr = getNextDatesFromCron({ cron, tz, maxCount: 1 });
  return arr && arr.length > 0 ? arr[0] : null;
}

/**
 * parseCronToPreset - reverse engineer preset from cron expression
 * Returns { preset, timeOfDay, weekday?, dayOfMonth? }
 * Cron format: "m h dom mon dow"
 */
export function parseCronToPreset(cronExpression: string): {
  preset: RecurrencePreset;
  timeOfDay: string;
  weekday?: number;
  dayOfMonth?: number;
} {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) {
    // Invalid cron, return defaults
    return { preset: 'monthly', timeOfDay: '09:00' };
  }

  const [minute, hour, dom, month, dow] = parts;
  const timeOfDay = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  // Check patterns
  if (dom === '*' && month === '*' && dow === '*') {
    // Daily: "m h * * *"
    return { preset: 'daily', timeOfDay };
  }

  if (dom === '*' && month === '*' && dow === '1-5') {
    // Weekdays: "m h * * 1-5"
    return { preset: 'weekdays', timeOfDay };
  }

  if (dom === '*' && month === '*' && dow !== '*') {
    // Weekly: "m h * * N"
    const weekday = parseInt(dow, 10);
    return { preset: 'weekly', timeOfDay, weekday: isNaN(weekday) ? 1 : weekday };
  }

  if (dom !== '*' && month === '*' && dow === '*') {
    // Monthly: "m h N * *"
    const dayOfMonth = parseInt(dom, 10);
    return { preset: 'monthly', timeOfDay, dayOfMonth: isNaN(dayOfMonth) ? 1 : dayOfMonth };
  }

  // Default fallback
  return { preset: 'monthly', timeOfDay };
}
