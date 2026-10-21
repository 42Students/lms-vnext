/**
 * GR-37/38: use safe value formatting in every customer-facing table.
 * Usage: formatDateIST(value), formatCurrencyINR(amount), formatCount(count),
 * and safeDisplayText(name). Never interpolate nullable values directly.
 */
const EMPTY = "—";
export function safeDisplayText(value: unknown, fallback = EMPTY): string {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}
export function formatDateIST(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return EMPTY;
  return `${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(date)} (IST)`;
}
export function formatCount(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value) : EMPTY;
}
export function formatCurrencyINR(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR",
      minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) : EMPTY;
}
export function validateDateRange(start: string, end: string): string | null {
  const from = new Date(start);
  const to = new Date(end);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()))
    return "Please enter a valid date and try again.";
  if (from.getTime() > to.getTime())
    return "The end date must be on or after the start date. Please adjust the dates.";
  return null;
}

/** Classroom attendance schedule only: preserve the legacy per-field date wording.
 * Other features should continue using the generic validateDateRange contract.
 */
export type ClassScheduleDateError = {
  field: "startDate" | "endDate" | "range";
  message: string;
};
function classScheduleIsoDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(value + "T00:00:00.000Z");
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
}
function safeDateInput(value: string): string {
  return value.length <= 32 && /^[0-9T:+.\-]*$/.test(value) ? value : "";
}
export function validateClassScheduleDateRange(startDate: string, endDate: string): ClassScheduleDateError | null {
  const start = classScheduleIsoDay(startDate);
  if (start === null) return {
    field: "startDate", message: "Invalid date 'startDate': " + safeDateInput(startDate),
  };
  const end = classScheduleIsoDay(endDate);
  if (end === null) return {
    field: "endDate", message: "Invalid date 'endDate': " + safeDateInput(endDate),
  };
  if (start > end) return {
    field: "range", message: "startDate must be before or equal to endDate",
  };
  return null;
}
