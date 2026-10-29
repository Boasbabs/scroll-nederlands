// Small formatting helpers for times and counts shown to the learner.
import { dayKey } from '../engine/progress';
import { DAY, HOUR, MINUTE } from '../engine/schedule';

/** "15:30" in the learner's local time (24-hour, as in the Netherlands). */
export function formatClock(at: number): string {
  const date = new Date(at);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "today, 15:30" for a time earlier today, else "20 Oct 2026" (day first, as in the Netherlands). */
export function formatDay(at: number, now: number): string {
  if (dayKey(at) === dayKey(now)) return `today, ${formatClock(at)}`;
  const date = new Date(at);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "in 25 min", "in 3 h", "tomorrow", "in 4 days". */
export function formatIn(at: number, now: number): string {
  const ms = Math.max(0, at - now);
  if (ms < HOUR) return `in ${Math.max(1, Math.round(ms / MINUTE))} min`;
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setHours(24, 0, 0, 0);
  if (at < startOfTomorrow.getTime()) return `in ${Math.round(ms / HOUR)} h`;
  if (at < startOfTomorrow.getTime() + DAY) return 'tomorrow';
  return `in ${Math.ceil((at - startOfTomorrow.getTime()) / DAY)} days`;
}

/** "3:12" for a session length. */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** "1 review", "12 reviews". */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
