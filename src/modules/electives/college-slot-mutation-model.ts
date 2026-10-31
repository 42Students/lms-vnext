import { z } from "zod";

const title = z.string().trim().min(1, "Name is required").max(150, "Name cannot exceed 150 characters");
const description = z.string().trim().max(1000).nullable();
const academicYear = z.string().trim().regex(/^\d{4}-\d{2}$/, {
  message: "Academic year must use YYYY-YY format, e.g. 2026-27",
}).refine(value => Number(value.slice(5)) === (Number(value.slice(0, 4)) + 1) % 100, {
  message: "Use consecutive YYYY-YY years, e.g. 2026-27",
}).nullable();
const pickCounts = {
  credits: z.number().int().min(0, "Credits must be between 0 and 30")
    .max(30, "Credits must be between 0 and 30"),
  // New slot picker mirrors the old 0..10 control; migration below can
  // preserve historical DB rows with >10 without truncating them.
  minPick: z.number().int().min(0, "Pick range is invalid").max(10, "Pick range is invalid"),
  maxPick: z.number().int().min(1, "Pick range is invalid").max(10, "Pick range is invalid"),
};

export const createCollegeElectiveSlotSchema = z.object({
  programId: z.string().uuid(),
  academicPeriodId: z.string().uuid().nullable(),
  semesterNumber: z.number().int().min(1, "Semester must be between 1 and 12").max(12, "Semester must be between 1 and 12"),
  academicYear,
  name: title,
  description,
  ...pickCounts,
  confirm: z.literal(true),
}).strict().refine((value) => value.minPick <= value.maxPick, {
  path: ["maxPick"], message: "Pick range is invalid",
});

export const editCollegeElectiveSlotSchema = z.object({
  expectedVersion: z.number().int().min(0),
  programId: z.string().uuid().optional(),
  academicPeriodId: z.string().uuid().nullable().optional(),
  semesterNumber: z.number().int().min(1, "Semester must be between 1 and 12").max(12, "Semester must be between 1 and 12").optional(),
  academicYear: academicYear.optional(),
  name: title,
  description,
  // Old persisted slots may exceed the new-form 10-choice cap. Parse their
  // original values without truncation; the locked service must reject any
  // attempt to CHANGE an over-cap limit (new slots still cap both fields at 10).
  credits: pickCounts.credits,
  minPick: z.number().int().min(0, "Pick range is invalid").safe(),
  maxPick: z.number().int().min(1, "Pick range is invalid").safe(),
  confirm: z.literal(true),
}).strict().refine((value) => value.minPick <= value.maxPick, {
  path: ["maxPick"], message: "Pick range is invalid",
});

export function normalizeSlotYear(year: string | null): string | null {
  if (year === null) return null;
  const match = /^(\d{4})-(\d{2}|\d{4})$/.exec(year);
  if (!match) throw new Error("ELECTIVE_YEAR_INVALID");
  const start = Number(match[1]);
  const target = start + 1;
  const endYear = match[2];
  if (endYear === undefined || Number(endYear) !== (endYear.length === 2 ? target % 100 : target)) {
    throw new Error("ELECTIVE_YEAR_INVALID");
  }
  return String(start) + "-" + String(target % 100).padStart(2, "0");
}

export function slotSelectionChanged(
  before: { credits: number; minPick: number; maxPick: number },
  next: { credits: number; minPick: number; maxPick: number },
) {
  return before.credits !== next.credits ||
    before.minPick !== next.minPick || before.maxPick !== next.maxPick;
}

/** Old backend permits a positive max above 10; only the legacy NEW-slot
 * browser control capped user-entered picks at 10. A privileged migration
 * adapter must preserve larger historical pick ranges without truncation.
 * Database check guards min<=max, and safe integers prevent overflow.
 */
export const legacyElectivePickImportSchema=z.strictObject({
  credits:z.number().int().min(0).max(30),
  minPick:z.number().int().min(0).safe(),
  maxPick:z.number().int().min(1).safe(),
}).refine(row=>row.minPick<=row.maxPick,{
  path:["maxPick"],message:"Pick range is invalid",
});

/** Zod reports API payload keys, while the form uses several legacy DOM names.
 * Translate only known scalar field names; never use arbitrary server paths in
 * form selectors (including "__proto__" or nested array indices).
 */
const slotApiIssueFields = {
  programId: "programId",
  academicPeriodId: "periodId",
  semesterNumber: "term",
  academicYear: "year",
  name: "name",
  description: "description",
  credits: "credits",
  minPick: "minPick",
  maxPick: "maxPick",
} as const;

export function electiveSlotFormErrorsFromIssues(issues: unknown): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!Array.isArray(issues)) return errors;
  for (const issue of issues) {
    if (!issue || typeof issue !== "object") continue;
    const { path, message } = issue as { path?: unknown; message?: unknown };
    if (!Array.isArray(path) || path.length !== 1 || typeof path[0] !== "string") continue;
    // Object prototype names are not form fields. Never resolve untrusted
    // issue paths through inherited properties (constructor, __proto__, etc).
    if (!Object.hasOwn(slotApiIssueFields, path[0])) continue;
    const field = slotApiIssueFields[path[0] as keyof typeof slotApiIssueFields];
    if (Object.hasOwn(errors, field)) continue;
    errors[field] = typeof message === "string" && message.trim()
      ? message : "Please check this field";
  }
  return errors;
}

/** Rebuild edit drafts from the newest server row each time a dialog reopens.
 * React keeps state across router.refresh; reusing the previous form state can
 * silently overwrite a newer saved name, description or elective rule.
 */
export function electiveSlotDraftFromRow(row: {
  programId?: string;
  academicPeriodId?: string | null;
  semesterNumber?: number;
  academicYear?: string | null;
  name?: string;
  description?: string | null;
  credits?: number;
  minPick?: number;
  maxPick?: number;
} | undefined) {
  return {
    programId: row?.programId ?? "",
    periodId: row?.academicPeriodId ?? "",
    term: String(row?.semesterNumber ?? 1),
    year: row?.academicYear ?? "",
    name: row?.name ?? "",
    description: row?.description ?? "",
    credits: String(row?.credits ?? 3),
    minPick: String(row?.minPick ?? 1),
    maxPick: String(row?.maxPick ?? 1),
  };
}

/** Normalized legacy form and constraint feedback for user-facing dialogs. */
export function collegeElectiveSlotErrorMessage(errorCode:string):string{
  const codes:Record<string,string>={
    ELECTIVE_SLOT_NOT_FOUND:"Elective slot not found.",
    ELECTIVE_SLOT_NAME_CONFLICT:"A slot with this name already exists.",
    ELECTIVE_SLOT_HAS_ENROLLMENTS:"This slot has student selections and cannot be removed.",
    ELECTIVE_SLOT_STALE:"This slot changed. Refresh its details and try again.",
    ELECTIVE_SLOT_PICK_RANGE_INVALID:"Pick range is invalid",
    ELECTIVE_SLOT_SEMESTER_INVALID:"Semester must be between 1 and 12",
    ELECTIVE_SLOT_CREDIT_INVALID:"Credits must be between 0 and 30",
    ELECTIVE_SLOT_PROGRAM_NOT_FOUND:"Please select a program.",
  };
  return codes[errorCode]??"Could not save the elective slot. Check its fields and try again.";
}
