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
