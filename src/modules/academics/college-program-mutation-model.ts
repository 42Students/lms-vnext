import { z } from "zod";

const name = z.string().trim()
  .min(1, "Please enter program name")
  .max(255, "Maximum 255 characters");
const code = z.string().trim().min(1).max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Invalid program code");
const durationTerms = z.number().int().min(1).max(24);

export const createCollegeProgramSchema = z.object({
  departmentId: z.string().uuid("Please select a department"),
  name,
  code,
  durationTerms,
}).strict();

export const updateCollegeProgramSchema = z.object({
  name,
  code,
  departmentId: z.string().uuid().optional(),
  durationTerms,
}).strict();

export const archiveCollegeProgramSchema = z.object({
  confirm: z.literal(true),
}).strict();

export const collegeProgramIdSchema = z.string().uuid();

export const restoreCollegeProgramSchema = z.object({
  action: z.literal("RESTORE"), confirm: z.literal(true),
}).strict();

/** Detect unsaved edits, even invalid input, before dismissing an edit dialog. */
export function hasUnsavedCollegeProgramEdit(
  saved: { name: string; code: string; durationTerms: number },
  draft: { name: string; code: string; durationTerms: string },
): boolean {
  return draft.name.trim() !== saved.name.trim() ||
    draft.code.trim() !== saved.code.trim() ||
    draft.durationTerms !== String(saved.durationTerms);
}

/** Old programs record years; default conversion is two semesters/year.
 * Imported zero-year source rows remain unresolved until an owner supplies a
 * duration, not silently transformed into a one-semester program.
 */
export function programDurationYearsToTerms(years:number,termsPerYear=2):number|null{
  if(!Number.isInteger(years)||years<1||years>10||
    !Number.isInteger(termsPerYear)||termsPerYear<1||termsPerYear>3)
    return null;
  const result=years*termsPerYear;
  return result>=1&&result<=24?result:null;
}

/** Permit legacy department/name/duration presentation while preserving
 * UUID+code on vNext mutation. Numeric IDs are never resolved from client
 * input; an authorized college-scoped crosswalk must supply the UUIDs. */
export function parseLegacyProgramCreateFields(raw:{
  name:string;dept_id:number;duration_years:number;
},lookups:{departmentId:string;code:string}){
  const duration=programDurationYearsToTerms(raw.duration_years);
  if(!duration)throw new Error("Duration must be between 1 and 10 years");
  if(!Number.isInteger(raw.dept_id)||raw.dept_id<1)
    throw new Error("Please select a department");
  return createCollegeProgramSchema.parse({
    departmentId:lookups.departmentId,
    name:raw.name,code:lookups.code,durationTerms:duration,
  });
}

export function canReduceProgramDuration(
  nextDurationTerms: number,
  highestReferencedTerm: number,
): boolean {
  return Number.isInteger(nextDurationTerms) &&
    nextDurationTerms >= 1 && nextDurationTerms <= 24 &&
    nextDurationTerms >= highestReferencedTerm;
}

/**
 * Read/import-only legacy ProgramDTO: an optional 0-year duration and absent
 * code are historical source facts, not valid inputs to the live UUID-first
 * program create/update endpoints. Map numeric IDs in a trusted college-scoped
 * migration and choose a real program duration before enabling instruction.
 */
export const legacyProgramSourceSchema = z.object({
  id: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Program name cannot be empty")
    .max(255, "Maximum 255 characters"),
  code: z.string().trim().max(64).nullish(),
  durationYears: z.number().int().min(0).default(0),
}).passthrough();

/** A zero-year imported program needs explicit owner remediation, not a fake
 * one-term default or a silent conversion during editing. */
export function isLegacyProgramDurationUnresolved(durationYears: number) {
  return !Number.isInteger(durationYears) || durationYears <= 0;
}
