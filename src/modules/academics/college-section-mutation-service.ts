import "server-only";

import { and, asc, count, eq, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohorts, colleges, courseSectionDeliveries,
  departments, learnerProgramEnrollments, organizations, programs, sectionEnrollments,
  sectionFacultyAssignments, sectionScheduleEvents, sections,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { postgresConstraintName } from "./errors";
import {
  collegeSectionIdSchema, createCollegeSectionSchema,
  sectionCapacityAllows, sectionIdentityChanged,
  sectionPeriodWithinCohort, updateCollegeSectionSchema,
} from "./college-section-mutation-model";

export type CollegeSectionErrorCode =
  | "CLASS_COHORT_NOT_FOUND"
  | "CLASS_NOT_FOUND"
  | "CLASS_COHORT_NOT_MUTABLE"
  | "CLASS_PERIOD_INVALID"
  | "CLASS_NAME_CONFLICT"
  | "CLASS_CODE_CONFLICT"
  | "CLASS_HAS_DEPENDENCIES"
  | "CLASS_CAPACITY_BELOW_ENROLLMENT"
  | "CLASS_MIN_SIZE_ABOVE_CAPACITY";

export class CollegeSectionError extends Error {
  constructor(public readonly code: CollegeSectionErrorCode, message?: string) {
    super(message ?? code);
    this.name = "CollegeSectionError";
  }
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function ownCollege(context: RequestContext) {
  return resolveActingCollege(context, "academics.manage");
}

async function lockCohort(tx: Tx, cohortId: string, collegeId: string) {
  const [row] = await tx.select({
    id: cohorts.id, status: cohorts.status,
    startPeriodId: cohorts.startPeriodId,
    expectedEndPeriodId: cohorts.expectedEndPeriodId,
  }).from(cohorts)
    .innerJoin(programs, and(eq(programs.id, cohorts.programId), eq(programs.status, "ACTIVE")))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
      isNull(departments.archivedAt),
    ))
    .innerJoin(colleges, and(
      eq(colleges.id, departments.collegeId), eq(colleges.status, "ACTIVE"),
    ))
    .innerJoin(organizations, and(
      eq(organizations.id, colleges.organizationId), eq(organizations.status, "ACTIVE"),
    ))
    .where(eq(cohorts.id, cohortId))
    .for("update").limit(1);
  if (!row) throw new CollegeSectionError("CLASS_COHORT_NOT_FOUND");
  if (row.status !== "PLANNED" && row.status !== "ACTIVE") {
    throw new CollegeSectionError("CLASS_COHORT_NOT_MUTABLE");
  }
  return row;
}

async function assertPeriod(tx: Tx, cohort: Awaited<ReturnType<typeof lockCohort>>,
  periodId: string, collegeId: string,
) {
  const ids = [periodId, cohort.startPeriodId];
  if (cohort.expectedEndPeriodId) ids.push(cohort.expectedEndPeriodId);
  const result = await tx.select({
    id: academicPeriods.id,
    start: academicPeriods.startDate,
    end: academicPeriods.endDate,
    status: academicPeriods.status,
  }).from(academicPeriods)
    .where(and(eq(academicPeriods.collegeId, collegeId),
      or(...ids.map(id => eq(academicPeriods.id, id)))))
    .for("share");
  const byId = new Map(result.map(item => [item.id, item]));
  const period = byId.get(periodId);
  const start = byId.get(cohort.startPeriodId);
  const end = cohort.expectedEndPeriodId ? byId.get(cohort.expectedEndPeriodId) : null;
  if (!period || !start || (cohort.expectedEndPeriodId && !end) ||
    period.status === "CLOSED" ||
    !sectionPeriodWithinCohort(start.start, end?.end ?? null, period.start, period.end)) {
    throw new CollegeSectionError("CLASS_PERIOD_INVALID");
  }
}

async function assertUnique(tx: Tx, cohortId: string, periodId: string,
  name: string, code: string, ignoreId?: string,
) {
  const rows = await tx.select({
    id: sections.id, name: sections.name, code: sections.code,
    academicPeriodId: sections.academicPeriodId,
  }).from(sections).where(and(
    eq(sections.cohortId, cohortId),
    eq(sections.status, "ACTIVE"),
    or(
      sql`lower(${sections.name}) = ${name.toLowerCase()}`,
      and(eq(sections.academicPeriodId, periodId),
        sql`lower(${sections.code}) = ${code.toLowerCase()}`),
    ),
  ));
  for (const row of rows) {
    if (row.id === ignoreId) continue;
    if (row.name.toLowerCase() === name.toLowerCase()) {
      throw new CollegeSectionError("CLASS_NAME_CONFLICT");
    }
    if (row.academicPeriodId === periodId && row.code.toLowerCase() === code.toLowerCase()) {
      throw new CollegeSectionError("CLASS_CODE_CONFLICT");
    }
  }
}

async function activeEnrollments(tx: Tx, sectionId: string) {
  const [row] = await tx.select({ total: count() }).from(sectionEnrollments)
    .innerJoin(learnerProgramEnrollments, and(
      eq(learnerProgramEnrollments.id, sectionEnrollments.learnerEnrollmentId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    ))
    .where(and(
      eq(sectionEnrollments.sectionId, sectionId),
      eq(sectionEnrollments.status, "ACTIVE"),
    ));
  return row?.total ?? 0;
}

async function hasDependencies(tx: Tx, sectionId: string) {
  const [[enrollment], [faculty], [event], [delivery]] = await Promise.all([
    tx.select({ id: sectionEnrollments.id }).from(sectionEnrollments)
      .where(eq(sectionEnrollments.sectionId, sectionId)).limit(1),
    tx.select({ id: sectionFacultyAssignments.id }).from(sectionFacultyAssignments)
      .where(eq(sectionFacultyAssignments.sectionId, sectionId)).limit(1),
    tx.select({ id: sectionScheduleEvents.id }).from(sectionScheduleEvents)
      .where(eq(sectionScheduleEvents.sectionId, sectionId)).limit(1),
    tx.select({ id: courseSectionDeliveries.id }).from(courseSectionDeliveries)
      .where(eq(courseSectionDeliveries.sectionId, sectionId)).limit(1),
  ]);
  return Boolean(enrollment || faculty || event || delivery);
}

function mapError(error: unknown): never {
  if (error instanceof AuthorizationError || error instanceof CollegeSectionError) throw error;
  switch (postgresConstraintName(error)) {
    case "sections_active_cohort_period_name_uq":
      throw new CollegeSectionError("CLASS_NAME_CONFLICT");
    case "sections_active_cohort_period_code_uq":
      throw new CollegeSectionError("CLASS_CODE_CONFLICT");
    case "sections_capacity_ck":
      throw new CollegeSectionError("CLASS_CAPACITY_BELOW_ENROLLMENT");
    case "sections_min_size_ck":
      throw new CollegeSectionError("CLASS_MIN_SIZE_ABOVE_CAPACITY");
  }
  throw error;
}

export async function createCollegeSection(context: RequestContext, raw: unknown) {
  const input = createCollegeSectionSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const cohort = await lockCohort(tx, input.cohortId, member.collegeId);
      await assertPeriod(tx, cohort, input.academicPeriodId, member.collegeId);
      await assertUnique(tx, cohort.id, input.academicPeriodId, input.name, input.code);
      const [created] = await tx.insert(sections).values(input).returning();
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_CLASS_CREATED,
        organizationId: member.organizationId, collegeId: member.collegeId,
        subjectType: "section", subjectId: created.id, subjectLabel: created.name,
        summary: "Class created",
        metadata: {
          cohortId: created.cohortId, academicPeriodId: created.academicPeriodId,
          code: created.code, capacity: created.capacity,
        },
      });
      return created;
    });
  } catch (error) { return mapError(error); }
}

export async function updateCollegeSection(context: RequestContext,
  sectionIdInput: unknown, raw: unknown,
) {
  const sectionId = collegeSectionIdSchema.parse(sectionIdInput);
  const input = updateCollegeSectionSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const [reference] = await tx.select({
        cohortId: sections.cohortId,
      }).from(sections)
        .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
        .innerJoin(programs, eq(programs.id, cohorts.programId))
        .innerJoin(departments, and(
          eq(departments.id, programs.departmentId),
          eq(departments.collegeId, member.collegeId),
        ))
        .where(eq(sections.id, sectionId)).limit(1);
      if (!reference) throw new CollegeSectionError("CLASS_NOT_FOUND");
      const cohort = await lockCohort(tx, reference.cohortId, member.collegeId);
      const [current] = await tx.select().from(sections)
        .where(and(
          eq(sections.id, sectionId),
          eq(sections.cohortId, reference.cohortId),
          eq(sections.status, "ACTIVE"),
        )).for("update").limit(1);
      if (!current) throw new CollegeSectionError("CLASS_NOT_FOUND");
      const nextCohortId = input.cohortId ?? current.cohortId;
      const nextPeriodId = input.academicPeriodId ?? current.academicPeriodId;
      const nextCohort = nextCohortId === current.cohortId
        ? cohort : await lockCohort(tx, nextCohortId, member.collegeId);
      await assertPeriod(tx, nextCohort, nextPeriodId, member.collegeId);
      const reassigning = nextCohortId !== current.cohortId ||
        nextPeriodId !== current.academicPeriodId;
      if ((reassigning || sectionIdentityChanged(current, input)) &&
          await hasDependencies(tx, sectionId)) {
        throw new CollegeSectionError("CLASS_HAS_DEPENDENCIES",
          "Move students and remove dependent schedules, teaching assignments and deliveries before reassigning this class.");
      }
      const occupied = await activeEnrollments(tx, sectionId);
      if (!sectionCapacityAllows(input.capacity, occupied)) {
        throw new CollegeSectionError("CLASS_CAPACITY_BELOW_ENROLLMENT",
          `Move students out first: ${occupied} active learner(s) are enrolled.`);
      }
      const nextMinSize = input.minSize === undefined ? current.minSize : input.minSize;
      if (nextMinSize !== null && input.capacity !== null && nextMinSize > input.capacity) {
        throw new CollegeSectionError("CLASS_MIN_SIZE_ABOVE_CAPACITY");
      }
      await assertUnique(tx, nextCohortId, nextPeriodId,
        input.name, input.code, sectionId);
      const [updated] = await tx.update(sections).set({
        cohortId: nextCohortId, academicPeriodId: nextPeriodId,
        name: input.name, code: input.code, capacity: input.capacity,
        minSize: nextMinSize,
        ...(input.description !== undefined ? { description: input.description } : {}), updatedAt: new Date(),
      }).where(and(eq(sections.id, sectionId), eq(sections.status, "ACTIVE")))
        .returning();
      if (!updated) throw new CollegeSectionError("CLASS_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_CLASS_UPDATED,
        organizationId: member.organizationId, collegeId: member.collegeId,
        subjectType: "section", subjectId: updated.id, subjectLabel: updated.name,
        summary: "Class updated",
        metadata: {
          cohortId: updated.cohortId, academicPeriodId: updated.academicPeriodId,
          fromName: current.name, fromCode: current.code,
          fromCohortId: current.cohortId, toCohortId: updated.cohortId,
          fromPeriodId: current.academicPeriodId, toPeriodId: updated.academicPeriodId,
          fromCapacity: current.capacity, toCapacity: updated.capacity,
          fromMinSize: current.minSize, toMinSize: updated.minSize,
        },
      });
      return updated;
    });
  } catch (error) { return mapError(error); }
}

/** Select menus are server-scoped. These are not permission grants for writes. */
export async function listCollegeSectionOptions(context: RequestContext) {
  const member = await ownCollege(context);
  const db = getDb();
  const [cohortChoices, periodChoices] = await Promise.all([
    db.select({
      id: cohorts.id,
      name: cohorts.name,
      code: cohorts.code,
      programName: programs.name,
      programId: programs.id,
      status: cohorts.status,
    }).from(cohorts)
      .innerJoin(programs, and(
        eq(programs.id, cohorts.programId), eq(programs.status, "ACTIVE"),
      ))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, member.collegeId),
        isNull(departments.archivedAt),
      ))
      .where(or(eq(cohorts.status, "PLANNED"), eq(cohorts.status, "ACTIVE")))
      .orderBy(asc(programs.name), asc(cohorts.name)),
    db.select({
      id: academicPeriods.id,
      name: academicPeriods.name,
      code: academicPeriods.code,
    }).from(academicPeriods)
      .where(and(
        eq(academicPeriods.collegeId, member.collegeId),
        or(eq(academicPeriods.status, "PLANNED"), eq(academicPeriods.status, "ACTIVE")),
      ))
      .orderBy(asc(academicPeriods.startDate)),
  ]);
  return { cohorts: cohortChoices, periods: periodChoices };
}
