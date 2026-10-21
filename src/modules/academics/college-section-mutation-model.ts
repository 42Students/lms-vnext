import { z } from "zod";

const uuid = z.string().uuid();
const name = z.string().trim().min(1, "Enter the class or section name").max(255);
const code = z.string().trim().min(1).max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Invalid class code");
const capacity = z.number().int().min(1).max(200).nullable();
const minSize = z.number().int().min(0).max(200).nullable().optional();
const creationCapacity=z.number().int("Maximum must be a whole number from 1 to 200").min(1,"Maximum must be a whole number from 1 to 200").max(200,"Maximum must be a whole number from 1 to 200");
const description = z.string().trim().max(2000).nullable().optional();

export const collegeSectionIdSchema = uuid;
export const createCollegeSectionSchema = z.object({
  cohortId: uuid,
  academicPeriodId: uuid,
  name,
  code,
  capacity:creationCapacity,
  minSize,
  description,
}).strict().superRefine((input, ctx) => {
  if (input.minSize != null && input.minSize > input.capacity) {
    ctx.addIssue({ code: "custom", path: ["minSize"], message: "Minimum students cannot exceed capacity." });
  }
});

export const updateCollegeSectionSchema = z.object({
  name,
  code,
  capacity,
  minSize,
  cohortId: uuid.optional(),
  academicPeriodId: uuid.optional(),
  description,
  confirm: z.literal(true),
}).strict().superRefine((input, ctx) => {
  if (input.minSize != null && input.capacity != null && input.minSize > input.capacity) {
    ctx.addIssue({ code: "custom", path: ["minSize"], message: "Minimum students cannot exceed capacity." });
  }
});

export function sectionIdentityChanged(
  current: { name: string; code: string },
  next: { name: string; code: string },
): boolean {
  return current.name !== next.name || current.code !== next.code;
}

export function sectionCapacityAllows(
  proposed: number | null,
  activeEnrolled: number,
): boolean {
  return proposed === null || proposed >= activeEnrolled;
}

export function sectionPeriodWithinCohort(
  start: string, end: string | null,
  periodStart: string, periodEnd: string,
): boolean {
  return periodStart >= start && (end === null || periodEnd <= end);
}
