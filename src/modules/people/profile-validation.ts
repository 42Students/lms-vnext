import { z } from "zod";

const optionalProfileText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .nullable()
    .optional();

export const learnerProfileInputSchema = z.object({
  rollNumber: optionalProfileText(128),
  registrationNumber: optionalProfileText(128),
});

export const facultyProfileInputSchema = z.object({
  primaryDepartmentId: z.string().uuid().nullable().optional(),
  employmentType: optionalProfileText(128),
  academicTitle: optionalProfileText(128),
});

export type LearnerProfileInput = z.infer<
  typeof learnerProfileInputSchema
>;
export type FacultyProfileInput = z.infer<
  typeof facultyProfileInputSchema
>;
