import { z } from "zod";
import { placementReportCsv } from "./report-model";

export const tpoOfferExpiryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
}).strict();
export type TpoOfferExpiryFact = {
  offerId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  roleTitle: string;
  candidateName: string | null;
  status: string;
  expiryDayIst: string;
  expiryAtIso: string;
};
export function isoDateInIndia(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values["year"]}-${values["month"]}-${values["day"]}`;
}
/** Calendar arithmetic uses date-only UTC to avoid server/browser timezone rollover. */
export function plusCalendarDays(start: string, days: number) {
  const startMs = Date.parse(start + "T00:00:00Z");
  if (!Number.isFinite(startMs) || !Number.isInteger(days)) throw new Error("Invalid calendar range");
  return new Date(startMs + days * 86_400_000).toISOString().slice(0, 10);
}
export const TPO_EXPIRY_CSV_ROW_LIMIT = 200;
export function projectTpoOfferExpiryWatchlist(
  rows: readonly TpoOfferExpiryFact[], todayIst: string,
  endIst: string,
) {
  const unique = new Map<string, TpoOfferExpiryFact>();
  for (const row of rows) {
    if (row.status !== "ISSUED" || row.expiryDayIst < todayIst || row.expiryDayIst > endIst) continue;
    unique.set(row.offerId, row);
  }
  const ordered = [...unique.values()].sort((a, b) =>
    a.expiryDayIst.localeCompare(b.expiryDayIst) ||
    a.expiryAtIso.localeCompare(b.expiryAtIso) ||
    a.offerId.localeCompare(b.offerId));
  return {
    asOfIst: todayIst, throughIst: endIst,
    rows: ordered.slice(0, TPO_EXPIRY_CSV_ROW_LIMIT),
    truncated: ordered.length > TPO_EXPIRY_CSV_ROW_LIMIT,
  };
}
export function tpoOfferExpiryCsv(result: ReturnType<typeof projectTpoOfferExpiryWatchlist>) {
  const data: (string | number | null)[][] = result.rows.map((row) => [
    row.expiryDayIst, row.expiryAtIso, row.candidateName ?? "Name not recorded",
    row.companyName, row.jobTitle, row.roleTitle, row.offerId,
  ]);
  data.push(["Methodology", "ISSUED offers with a recorded expiry calendar date in IST between " +
    result.asOfIst + " and " + result.throughIst + " (inclusive). Missing expiry and non-issued offers excluded.",
    "", "", "", "", ""]);
  if (result.truncated) data.push(["TRUNCATED",
    `Only the first ${TPO_EXPIRY_CSV_ROW_LIMIT} rows are exported; more offers match this date window.`,
    "", "", "", "", ""]);
  return placementReportCsv(["Expiry day IST", "Expiry timestamp ISO", "Student", "Company",
    "Drive", "Offer role", "Offer ID"], data);
}
