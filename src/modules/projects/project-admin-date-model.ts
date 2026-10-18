/** IIT Dharwad Projects: calendar dates are always in the product's IST zone. */
export function formatProjectAdminUpdatedDateIst(value:Date):string {
  if (!Number.isFinite(value.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeZone:"Asia/Kolkata",
  }).format(value);
}

/** A corrupt legacy timestamp should not crash a Projects admin page. */
export function formatProjectAdminActivityDateIst(value:Date|null):string {
  if (!value) return "Not submitted";
  if (!Number.isFinite(value.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(value);
}

/** Produce a truthful UTC value for page-limited CSV without throwing. */
export function safeProjectAdminUtcIso(value:Date):string {
  return Number.isFinite(value.getTime()) ? value.toISOString() : "Date unavailable";
}
