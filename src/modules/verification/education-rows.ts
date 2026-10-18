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
  return value.flatMap((entry: unknown, index: number) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const string = (key: string): string =>
      typeof record[key] === "string" ? String(record[key]).slice(0, 200) : "—";
    return [{
      id: String(index),
      level: string("educationType"),
      institution: string("institutionName") !== "—"
        ? string("institutionName") : string("institution"),
      year: string("endYear"),
      marks: string("grade"),
      marksheet: typeof record.marksheetDocumentId === "string" ? "Submitted" as const : "Missing" as const,
    }];
  });
}
