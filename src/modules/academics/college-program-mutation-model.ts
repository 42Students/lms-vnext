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
  return draft.name !== saved.name ||
    draft.code !== saved.code ||
    draft.durationTerms !== String(saved.durationTerms);
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
