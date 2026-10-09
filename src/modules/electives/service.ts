import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  cohorts, courseOfferings, courseSectionDeliveries, courses, sections,
  departments, electiveOfferings, electiveSlots, lmsGroupMembers, lmsGroups, programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadAcademicPeriodScope, loadProgramScope } from "@/modules/academics/scope";
import { postgresConstraintName } from "@/modules/academics/errors";

const uuid = z.string().uuid();
const slotInput = z.object({
  collegeId: uuid,
  programId: uuid,
  academicPeriodId: uuid.nullish(),
  semesterNumber: z.number().int().min(1).max(12),
  academicYear: z.string().max(20).nullish(),
  name: z.string().trim().min(1).max(150),
  description: z.string().max(1000).nullish(),
  credits: z.number().int().min(0).max(30).default(3),
  minPick: z.number().int().min(0).default(1),
  maxPick: z.number().int().positive().default(1),
}).refine(value => value.minPick <= value.maxPick, { path: ["maxPick"], message: "maxPick must be >= minPick" });
const offeringInput = z.object({
  slotId: uuid,
  courseId: uuid,
  groupId: uuid,
  backedDeliveryId: uuid,
});

export class ElectivesServiceError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ElectivesServiceError";
  }
}

function normalizeAcademicYear(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const match = /^([0-9]{4})(?:-([0-9]{2}|[0-9]{4}))?$/.exec(raw.trim());
  if (!match) throw new ElectivesServiceError("ELECTIVE_ACADEMIC_YEAR_INVALID");
  const start = Number(match[1]), next = start + 1, end = match[2];
  if (end && Number(end) !== (end.length === 2 ? next % 100 : next))
    throw new ElectivesServiceError("ELECTIVE_ACADEMIC_YEAR_INVALID");
  return start + "-" + String(next % 100).padStart(2,"0");
}

export async function createElectiveSlot(context: RequestContext, raw: unknown) {
  const input = slotInput.parse(raw);
  const program = await loadProgramScope(input.programId);
  const [duration] = await getDb().select({ terms: programs.durationTerms })
    .from(programs).where(eq(programs.id, input.programId)).limit(1);
  if (!duration || input.semesterNumber > duration.terms)
    throw new ElectivesServiceError("ELECTIVE_SEMESTER_OUTSIDE_PROGRAM");
  requirePermission(context, "academics.manage", {
    organizationId: program.organizationId, collegeId: input.collegeId,
  });
  if (program.collegeId !== input.collegeId) {
    throw new ElectivesServiceError("ELECTIVE_PROGRAM_COLLEGE_MISMATCH");
  }
  if (input.academicPeriodId) {
    const period = await loadAcademicPeriodScope(input.academicPeriodId);
    if (period.collegeId !== input.collegeId || period.status === "CLOSED") {
      throw new ElectivesServiceError("ELECTIVE_PERIOD_INVALID");
    }
  }
  const [slot] = await getDb().insert(electiveSlots).values({
    collegeId: input.collegeId,
    programId: input.programId,
    academicPeriodId: input.academicPeriodId ?? null,
    semesterNumber: input.semesterNumber,
    academicYear: normalizeAcademicYear(input.academicYear),
    name: input.name,
    description: input.description ?? null,
    credits: input.credits,
    minPick: input.minPick,
    maxPick: input.maxPick,
  }).returning();
  return slot!;
}

export async function createElectiveOffering(context: RequestContext, raw: unknown) {
  const input = offeringInput.parse(raw);
  return getDb().transaction(async tx => {
    // Common slot lock serializes creation and elective membership policy.
    const [slot] = await tx.select().from(electiveSlots)
      .where(eq(electiveSlots.id, input.slotId)).for("update");
    if (!slot || slot.status !== "ACTIVE" || slot.deletedAt) {
      throw new ElectivesServiceError("ELECTIVE_SLOT_NOT_ACTIVE");
    }
    requirePermission(context, "academics.manage", { collegeId: slot.collegeId });
    const [group] = await tx.select().from(lmsGroups)
      .where(eq(lmsGroups.id, input.groupId)).for("update");
    if (!group || group.ownerScope !== "COLLEGE" ||
        group.collegeId !== slot.collegeId || group.kind !== "ELECTIVE" ||
        group.deletedAt || !["DRAFT","ACTIVE"].includes(group.status)) {
      throw new ElectivesServiceError("ELECTIVE_GROUP_SCOPE_MISMATCH");
    }
    // A group may only be attached as a new elective before enrollment.
    // Locking slot then group makes this safe against concurrent joins.
    const [roster] = await tx.select({ total: count() }).from(lmsGroupMembers)
      .where(and(eq(lmsGroupMembers.groupId, group.id),
        inArray(lmsGroupMembers.state, ["ACTIVE", "WAITLISTED"])));
    if (group.activeCount !== 0 || (roster?.total ?? 0) !== 0) {
      throw new ElectivesServiceError("ELECTIVE_GROUP_HAS_MEMBERS");
    }
    const [course] = await tx.select({
      id: courses.id,
      collegeId: departments.collegeId,
      status: courses.status,
    }).from(courses)
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(eq(courses.id, input.courseId)).limit(1);
    if (!course || course.collegeId !== slot.collegeId || course.status !== "ACTIVE") {
      throw new ElectivesServiceError("ELECTIVE_COURSE_COLLEGE_MISMATCH");
    }
    {
      const [delivery] = await tx.select({
        id: courseSectionDeliveries.id,
        courseId: courseOfferings.courseId,
        collegeId: departments.collegeId,
        offeringPeriodId: courseOfferings.academicPeriodId,
        offeringCohortId: courseOfferings.cohortId,
        offeringStatus: courseOfferings.status,
        offeringType: courseOfferings.type,
        sectionCohortId: sections.cohortId,
        sectionPeriodId: sections.academicPeriodId,
        sectionStatus: sections.status,
        endedAt: courseSectionDeliveries.endedAt,
      }).from(courseSectionDeliveries)
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .innerJoin(sections, eq(sections.id, courseSectionDeliveries.sectionId))
        .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
        .innerJoin(programs, eq(programs.id, cohorts.programId))
        .innerJoin(departments, eq(departments.id, programs.departmentId))
        .where(eq(courseSectionDeliveries.id, input.backedDeliveryId)).limit(1);
      if (!delivery || delivery.courseId !== course.id || delivery.collegeId !== slot.collegeId ||
          delivery.offeringType !== "ELECTIVE" || delivery.offeringStatus !== "ACTIVE" ||
          delivery.sectionStatus !== "ACTIVE" || delivery.endedAt !== null ||
          delivery.sectionCohortId !== delivery.offeringCohortId ||
          delivery.sectionPeriodId !== delivery.offeringPeriodId ||
          (slot.academicPeriodId !== null && slot.academicPeriodId !== delivery.offeringPeriodId)) {
        throw new ElectivesServiceError("ELECTIVE_DELIVERY_MISMATCH");
      }
    }
    try {
      const [offering] = await tx.insert(electiveOfferings).values({
        slotId: slot.id, courseId: course.id, groupId: group.id,
        backedDeliveryId: input.backedDeliveryId,
        capacity: group.capacity,
      }).returning();
      return offering!;
    } catch (error) {
      const constraint = postgresConstraintName(error);
      if (constraint === "elective_offerings_slot_active_course_uq") {
        throw new ElectivesServiceError("ELECTIVE_COURSE_ALREADY_OFFERED");
      }
      if (constraint === "elective_offerings_group_uq") {
        throw new ElectivesServiceError("ELECTIVE_GROUP_ALREADY_OFFERED");
      }
      if (constraint === "elective_offerings_delivery_uq") {
        throw new ElectivesServiceError("ELECTIVE_DELIVERY_ALREADY_USED");
      }
      throw error;
    }
  });
}

export async function listElectiveOfferings(context: RequestContext, slotIdInput: string) {
  const slotId = uuid.parse(slotIdInput);
  const [slot] = await getDb().select().from(electiveSlots)
    .where(eq(electiveSlots.id, slotId)).limit(1);
  if (!slot || slot.deletedAt) throw new ElectivesServiceError("ELECTIVE_SLOT_NOT_FOUND");
  requirePermission(context, "academics.read", { collegeId: slot.collegeId });
  return getDb().select({
    offeringId: electiveOfferings.id,
    courseId: electiveOfferings.courseId,
    groupId: electiveOfferings.groupId,
    backedDeliveryId: electiveOfferings.backedDeliveryId,
    capacity: electiveOfferings.capacity,
    status: electiveOfferings.status,
    activeMembers: lmsGroups.activeCount,
  }).from(electiveOfferings)
    .innerJoin(lmsGroups, eq(lmsGroups.id, electiveOfferings.groupId))
    .where(and(eq(electiveOfferings.slotId, slotId),
      eq(electiveOfferings.status, "ACTIVE")));
}

/** Same-slot administrative transfer is transactional in the group kernel. */
export { moveElectiveMember as moveElectiveSelection } from "@/modules/groups/service";
