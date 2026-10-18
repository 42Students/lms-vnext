/** Bounded, display-only fields for the private verification review panel.
 * Never serialize identity documents or full arbitrary snapshot objects.
 */
export type VerificationEducationRow = {
  id: string;
  level: string;
  institution: string;
  year: string;
  marks: string;
  marksheet: "Submitted" | "Missing";
};

export function verificationEducationRows(value: unknown): VerificationEducationRow[] {
  if (!Array.isArray(value)) return [];
  // A malformed or oversized saved snapshot must not exhaust a staff drawer.
  return value.slice(0,100).flatMap((entry: unknown, index: number) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const string = (key: string): string => {
      const field=record[key];
      if(typeof field==="string")return field.trim().slice(0,200)||"—";
      if(typeof field==="number"&&Number.isFinite(field))return String(field);
      return "—";
    };
    return [{
      id: String(index),
      level: string("educationType"),
      institution: string("institutionName") !== "—"
        ? string("institutionName") : string("institution"),
      year: string("endYear"),
      marks: string("grade"),
      marksheet: typeof record.marksheetDocumentId === "string" &&
        record.marksheetDocumentId.trim().length>0 ? "Submitted" as const : "Missing" as const,
    }];
  });
}
