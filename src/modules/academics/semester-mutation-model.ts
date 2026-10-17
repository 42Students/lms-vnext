import { z } from "zod";

const semesterName = z.string().trim().min(1, "Semester name is required").max(255);
const credits = z.number().int().min(0).max(1000).nullable();

export const createCollegeSemesterSchema = z.object({
  programId: z.string().uuid(),
  termNumber: z.number().int().min(1).max(12),
  name: semesterName,
  totalCredits: credits.optional(),
}).strict();

export const updateCollegeSemesterSchema = z.object({
  name: semesterName,
  totalCredits: credits,
  isActive: z.boolean(),
  expectedUpdatedAt: z.iso.datetime({offset:true}),
  confirm: z.literal(true),
}).strict();

export const deleteCollegeSemesterSchema = z.object({
  confirm: z.literal(true),
}).strict();

export const semesterIdSchema = z.string().uuid();

export function canCreateSemesterTerm(termNumber: number, durationTerms: number) {
  return Number.isInteger(termNumber) && termNumber >= 1 &&
    termNumber <= Math.min(durationTerms,12);
}

export type CreateCollegeSemesterInput = z.infer<typeof createCollegeSemesterSchema>;
export type UpdateCollegeSemesterInput = z.infer<typeof updateCollegeSemesterSchema>;
