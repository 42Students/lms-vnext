import { z } from "zod";

const uuid = z.string().uuid();
const name = z.string().trim().min(1).max(255);
const code = z.string().trim().min(1).max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Invalid class code");
const capacity = z.number().int().min(1).max(10000).nullable();

export const collegeSectionIdSchema = uuid;
export const createCollegeSectionSchema = z.object({
  cohortId: uuid,
  academicPeriodId: uuid,
  name,
  code,
  capacity,
}).strict();

export const updateCollegeSectionSchema = z.object({
  name,
  code,
  capacity,
  confirm: z.literal(true),
}).strict();

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
