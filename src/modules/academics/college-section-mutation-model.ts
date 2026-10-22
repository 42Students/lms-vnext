import { z } from "zod";

const uuid = z.string().uuid();
const name = z.string().trim().min(1, "Enter the class or section name").max(255, "Maximum 255 characters");
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

/** Legacy `_Class` (Classes.js classPayload, ClassController.java:75-106)
 * numeric-to-UUID migration contract. Legacy integer ids are never accepted
 * as vNext ids: the caller supplies an explicit batch-id -> cohort UUID map,
 * the academic period the section belongs to (new in vNext) and the section
 * code. Field mapping: name -> name, description -> description,
 * batch_id -> cohortId (program_id is implied by the cohort), upper_limit ->
 * capacity, lower_limit -> minSize. A legacy upper_limit of 0 meant "No limit"
 * but vNext requires a 1-200 capacity, so such rows must be given an explicit
 * capacity before import instead of silently becoming unlimited or 200. */
export function adaptLegacyClassCreate(
  source: {
    name: string;
    description?: string | null;
    batch_id?: number | string | null;
    upper_limit?: number | null;
    lower_limit?: number | null;
  },
  mapping: {
    cohortIds: ReadonlyMap<string, string>;
    academicPeriodId: string;
    code: string;
  },
) {
  const batchKey = source.batch_id === null || source.batch_id === undefined
    ? "" : String(source.batch_id);
  const cohortId = mapping.cohortIds.get(batchKey);
  if (!cohortId) throw new Error("LEGACY_CLASS_BATCH_UNMAPPED");
  const upper = source.upper_limit ?? 60;
  if (!Number.isInteger(upper) || upper < 1 || upper > 200)
    throw new Error("LEGACY_CLASS_CAPACITY_UNSUPPORTED");
  return createCollegeSectionSchema.parse({
    cohortId,
    academicPeriodId: mapping.academicPeriodId,
    name: source.name,
    code: mapping.code,
    capacity: upper,
    minSize: source.lower_limit ?? 0,
    description: source.description?.trim() ? source.description.trim() : null,
  });
}

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
    ctx.addIssue({ code: "custom", path: ["minSize"], message: "Maximum cannot be less than minimum" });
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
  // Zero means no maximum in the old ClassDTO, never a zero-seat class.
  upper_limit: z.number().int().min(0).max(200),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
}).superRefine((input, ctx) => {
  if (input.upper_limit !== 0 && input.lower_limit != null && input.lower_limit > input.upper_limit)
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
    // The legacy zero upper limit means unlimited, not a one-seat class.
    // Validate the lower limit with a temporary finite value before persisting null.
    capacity: input.upper_limit === 0 ? Math.max(1, input.lower_limit ?? 1) : input.upper_limit,
    minSize: input.lower_limit ?? null,
    description: input.description ?? null,
  });
  return {
    section: {...section,capacity:input.upper_limit===0?null:section.capacity},
    legacyClassId: input.id,
    capacityDisplay: input.upper_limit===0?"No limit":String(input.upper_limit),
    // Apply these only after resolving the owning academic period.
    legacyStartsAt: input.startDate ?? null,
    legacyEndsAt: input.endDate ?? null,
  };
}

/** Reused by detail tables, imported snapshots and existing unlimited
 * classes. A persisted null and old zero sentinel both mean no limit.
 * New class creation intentionally requires a finite 1..200 capacity.
 */
export function legacyClassCapacityLabel(value:number|null|undefined):string{
  return value===null||value===undefined||value===0?"No limit":String(value);
}

export const legacyClassSnapshotSchema=z.strictObject({
  legacyClassId:z.number().int().positive().nullable(),
  legacyStartsAt:z.iso.datetime({offset:true}).nullable(),
  legacyEndsAt:z.iso.datetime({offset:true}).nullable(),
});
