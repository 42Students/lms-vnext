import { z } from "zod";

const uuid = z.string().uuid();
const name = z.string().trim().min(1, "Enter the class or section name").max(255);
const code = z.string().trim().min(1).max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Invalid class code");
const capacity = z.number().int("Maximum must be a whole number from 1 to 200")
  .min(1, "Maximum must be a whole number from 1 to 200")
  .max(200, "Maximum must be a whole number from 1 to 200").nullable();
const minSize = z.number().int().min(0).max(200).nullable().optional();
const creationCapacity = z.number()
  .int("Maximum must be a whole number from 1 to 200")
  .min(1, "Maximum must be a whole number from 1 to 200")
  .max(200, "Maximum must be a whole number from 1 to 200");
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
    ctx.addIssue({ code: "custom", path: ["minSize"], message: "Maximum cannot be less than minimum" });
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


/**
 * Import boundary for legacy ClassDTO records.
 * Legacy program_id and batch_id are numeric identifiers, while a vNext
 * section requires a college-scoped UUID cohort and an explicit academic
 * period. Never infer the period from the current calendar year: resolve the
 * batch + semester mapping first, then persist legacyClassId on the section.
 * Optional legacy start/end values are migration metadata, not a substitute
 * for academic-period ownership validation.
 */
export const legacyClassImportSchema = z.object({
  id: z.number().int().positive(),
  program_id: z.number().int().positive(),
  batch_id: z.number().int().positive(),
  name: name,
  description: z.string().nullable().optional(),
  lower_limit: z.number().int().min(0).max(200).nullable().optional(),
  upper_limit: creationCapacity,
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
}).superRefine((input, ctx) => {
  if (input.lower_limit != null && input.lower_limit > input.upper_limit)
    ctx.addIssue({ code: "custom", path: ["upper_limit"],
      message: "Maximum cannot be less than minimum" });
});

export function translateLegacyClassToSection(
  raw: unknown,
  resolved: {
    cohortId: string;
    academicPeriodId: string;
    legacyBatchId: number;
    legacyProgramId: number;
    code: string;
  },
) {
  const input = legacyClassImportSchema.parse(raw);
  if (input.batch_id !== resolved.legacyBatchId ||
      input.program_id !== resolved.legacyProgramId)
    throw new Error("Legacy class program/batch mapping does not match");
  const section = createCollegeSectionSchema.parse({
    cohortId: uuid.parse(resolved.cohortId),
    academicPeriodId: uuid.parse(resolved.academicPeriodId),
    name: input.name,
    code: code.parse(resolved.code),
    capacity: input.upper_limit,
    minSize: input.lower_limit ?? null,
    description: input.description ?? null,
  });
  return {
    section,
    legacyClassId: input.id,
    // Apply these only after resolving the owning academic period.
    legacyStartsAt: input.startDate ?? null,
    legacyEndsAt: input.endDate ?? null,
  };
}
