import { educationLevel } from "./evidence";
import { VerificationStateError, type SafeSnapshot } from "./domain";

export type AcademicLevel = "10TH" | "12TH" | "DIPLOMA" | "UG" | "PG";
export type RawEntry = {
  level: AcademicLevel; grade: string; scale: string; max: string; endYear: string;
};

function comparableEndYear(raw: string): number {
  const value = raw.trim();
  return /^\d{4}$/.test(value) ? Number(value) : -1;
}

/**
 * The legacy profile editor permits duplicate levels and optional blank marks.
 * Only graded, recognized rows can publish marks. For a duplicate level, choose
 * the row with the latest endYear (last row wins a tie), irrespective of order.
 * Required graduation milestones are still enforced by private evidence checks.
 */
export function parseAcademicSnapshot(snapshot: SafeSnapshot): RawEntry[] {
  if (!Array.isArray(snapshot["education"])) throw new VerificationStateError("INVALID_SNAPSHOT");
  const latest = new Map<AcademicLevel, RawEntry>();
  // When the snapshot carries scanned private marksheet links, publish only
  // documented grades. Optional unbacked marks cannot drive eligibility.
  const hasDocumentRefs = snapshot["education"].some(value =>
    value !== null && typeof value === "object" && !Array.isArray(value) &&
    typeof (value as Record<string, unknown>)["marksheetDocumentId"] === "string"
  );
  for (const obj of snapshot["education"]) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      throw new VerificationStateError("INVALID_SNAPSHOT");
    }
    const raw = obj as Record<string, unknown>;
    if (typeof raw["educationType"] !== "string") {
      throw new VerificationStateError("INVALID_SNAPSHOT");
    }
    // Older learner profile entries can omit a blank grade or serialize it as
    // null. Treat those as ungraded; never allow them to replace prior grades.
    if (raw["grade"] === null || raw["grade"] === undefined || raw["grade"] === "") continue;
    if (typeof raw["grade"] !== "string") {
      throw new VerificationStateError("INVALID_SNAPSHOT");
    }
    const level = educationLevel(raw["educationType"]);
    if (!level || raw["grade"].trim() === "") continue;
    if (hasDocumentRefs && typeof raw["marksheetDocumentId"] !== "string") continue;
    if (typeof raw["gradingType"] !== "string" || typeof raw["max"] !== "string") {
      throw new VerificationStateError("INVALID_SNAPSHOT");
    }
    const entry: RawEntry = {
      level, grade: raw["grade"].trim(), scale: raw["gradingType"],
      max: raw["max"], endYear: typeof raw["endYear"] === "string" ? raw["endYear"] : "",
    };
    const previous = latest.get(level);
    if (!previous || comparableEndYear(entry.endYear) >= comparableEndYear(previous.endYear)) {
      latest.set(level, entry);
    }
  }
  // Incomplete core records must be returned to the learner for correction,
  // not approved as verified academic evidence.
  if (!latest.has("10TH") || (!latest.has("12TH") && !latest.has("DIPLOMA")) ||
      (!latest.has("UG") && !latest.has("PG"))) {
    throw new VerificationStateError("INVALID_SNAPSHOT");
  }
  return [...latest.values()];
}
