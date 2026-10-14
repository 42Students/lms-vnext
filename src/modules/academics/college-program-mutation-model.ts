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
  durationTerms,
}).strict();

export const archiveCollegeProgramSchema = z.object({
  confirm: z.literal(true),
}).strict();

export const collegeProgramIdSchema = z.string().uuid();

export function canReduceProgramDuration(
  nextDurationTerms: number,
  highestReferencedTerm: number,
): boolean {
  return Number.isInteger(nextDurationTerms) &&
    nextDurationTerms >= 1 && nextDurationTerms <= 24 &&
    nextDurationTerms >= highestReferencedTerm;
}
