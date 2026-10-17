import { z } from "zod";

const name = z.string().trim().min(1, "Program name is required").max(255);
const code = z.string().trim().min(1).max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Invalid program code");
const durationTerms = z.number().int().min(1).max(24);

export const createCollegeProgramSchema = z.object({
  departmentId: z.string().uuid(),
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
