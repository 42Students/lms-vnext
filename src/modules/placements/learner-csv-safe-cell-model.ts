import { spreadsheetCsvCell } from "@/security/csv-cell";

/** Keep the learner export's established control-character cleanup while
 * applying the same Unicode-aware formula guard as every other CSV export.
 * This is an encoding helper only: authorization remains with callers. */
export function learnerSafeCsvCell(raw:string):string{
 const normalized=raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu,"")
   .replace(/[\u200B-\u200D\u2060\uFEFF]/gu,"");
 return spreadsheetCsvCell(normalized);
}
