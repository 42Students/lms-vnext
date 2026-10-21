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
  ...pickCounts,
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
  if (Number(match[2]) !== (match[2].length === 2 ? target % 100 : target)) {
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
