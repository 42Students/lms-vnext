import moment from "moment";
import dayjs from "dayjs";

/**
 * Shared date formatting utilities.
 * All job/interview/application dates should use these to ensure consistent display.
 */

/** Format a UTC date to local "16 Feb 2026" */
export function formatDateShort(raw) {
  if (!raw) return "-";
  const m = moment.utc(raw).local();
  return m.isValid() ? m.format("DD MMM YYYY") : "-";
}

/** Format a UTC date to local "16 Feb 2026, 02:30 PM" */
export function formatDateTime(raw) {
  if (!raw) return "-";
  const m = moment.utc(raw).local();
  return m.isValid() ? m.format("DD MMM YYYY, hh:mm A") : "-";
}

/** Format a UTC date to local "February 2026" */
export function formatMonthYear(date) {
  return moment(date).format("MMMM YYYY");
}

/** Format a date for navigation header "16 Feb 2026" */
export function formatNavDate(date) {
  return moment(date).format("DD MMM YYYY");
}

/** Safely parse a date string and return Date or null */
export function safeParseDateOrNull(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * A time the author typed (an assignment deadline, a quiz due time). The server stores it as the
 * author's wall-clock with no zone and may send it as a Jackson array ([2026, 10, 4, 23, 59]) or a
 * zone-less string. Read it as local wall-clock; dayjs([array]) on its own is "Invalid Date".
 */
export function wallClockToDayjs(raw) {
  if (raw == null || raw === "") return null;
  if (Array.isArray(raw)) {
    const [y, mo = 1, d = 1, h = 0, mi = 0, s = 0] = raw;
    const parsed = dayjs(new Date(y, mo - 1, d, h, mi, s));
    return parsed.isValid() ? parsed : null;
  }
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed : null;
}

export function formatWallClock(raw, format = "MMM D, YYYY h:mm A", empty = "—") {
  const parsed = wallClockToDayjs(raw);
  return parsed ? parsed.format(format) : empty;
}

/**
 * The moment a deadline falls, in epoch ms (LRN-X-03). The backend compares author-typed deadlines
 * (quiz dueAt, assignment deadline) in India time, so a zone-less value — "2026-10-06T18:00:00" or a
 * Jackson array — is read as Asia/Kolkata (a fixed +05:30, no daylight saving), not the browser's own
 * zone. A value that carries its own zone ("...Z", "+05:30") is used as given. Without this, a device
 * set to another time zone saw a quiz open or close at a different moment than the server enforced.
 */
export function deadlineMs(raw) {
  if (raw == null || raw === "") return NaN;
  const IST_OFFSET_MS = 330 * 60 * 1000;
  if (Array.isArray(raw)) {
    const [y, mo = 1, d = 1, h = 0, mi = 0, s = 0] = raw.map(Number);
    return Date.UTC(y, mo - 1, d, h, mi, s) - IST_OFFSET_MS;
  }
  const text = String(raw).trim();
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(text)) return Date.parse(text);
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return Date.parse(text);
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
  return Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) - IST_OFFSET_MS;
}

/** True once an author-typed deadline (India time) has passed. */
export function isPastDeadline(raw, nowMs = Date.now()) {
  const ms = deadlineMs(raw);
  return Number.isFinite(ms) && ms < nowMs;
}
