import { z } from "zod";

/** Public job DTO field: user-authored label and date only. This projection
 * must be called AFTER a published, opt-in job and college are authorized.
 * Never expose legacy posting JSON, eligibility rules or private URLs. */
export const publicJobImportantDateSchema = z.strictObject({
  label: z.string().trim().min(1).max(120),
  date: z.iso.date(),
});
export type PublicJobImportantDate = z.infer<typeof publicJobImportantDateSchema>;

const dateTimeSchema = z.iso.datetime({ offset: true });
const dateOnlySchema = z.iso.date();

/** Converts the legacy date/at representations to bounded safe JSON dates.
 * Bad or unzoned values are omitted, never silently interpreted in server TZ. */
export function publicJobImportantDatesFromLegacy(details: unknown): PublicJobImportantDate[] {
  if (!details || typeof details !== "object") return [];
  const rows = (details as { importantDates?: unknown }).importantDates;
  if (!Array.isArray(rows)) return [];
  const result: PublicJobImportantDate[] = [];
  for (const entry of rows.slice(0, 20)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = z.string().trim().min(1).max(120).safeParse(row.label);
    if (!name.success) continue;
    const raw = typeof row.date === "string" ? row.date :
      typeof row.at === "string" ? row.at : "";
    let date: string;
    if (dateOnlySchema.safeParse(raw).success) {
      // Reject invalid leap-days and dates normalized by JavaScript.
      const parsed = new Date(raw + "T12:00:00.000Z");
      if (!Number.isFinite(parsed.getTime()) ||
          parsed.toISOString().slice(0, 10) !== raw) continue;
      date = raw;
    } else if (dateTimeSchema.safeParse(raw).success) {
      const at = new Date(raw);
      if (!Number.isFinite(at.getTime())) continue;
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(at);
      const get = (kind: string) => parts.find(part => part.type === kind)?.value ?? "";
      date = get("year") + "-" + get("month") + "-" + get("day");
    } else {
      continue;
    }
    const safe = publicJobImportantDateSchema.safeParse({ label: name.data, date });
    if (safe.success) result.push(safe.data);
  }
  return result;
}
