import { and, asc, count, countDistinct, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  cohorts, courseOfferings, courseSectionDeliveries, courses, sections,
  departments, electiveOfferings, electiveSlots, groupBackedClassOfferings, lmsGroupMembers, lmsGroups, programs,
  collegeMemberships, courseTeachingAssignments, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadAcademicPeriodScope, loadProgramScope } from "@/modules/academics/scope";
import { postgresConstraintName } from "@/modules/academics/errors";
import { assertPersistedGroupActor } from "@/modules/groups/actor-access";
import {assertCollegeElectivesEnabled} from "./college-elective-module-guard";

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
  groupId: uuid.optional(),
  backedDeliveryId: uuid,
  // Legacy null capacity means unlimited seats. The group kernel supports null.
  capacity: z.number().int().positive().nullable().default(null),
});

export class ElectivesServiceError extends Error {
  constructor(public readonly code: string, public readonly currentEnrolledCount?: number) {
    super(code === "ELECTIVE_CAPACITY_BELOW_ENROLLMENT" && currentEnrolledCount !== undefined
      ? `Capacity cannot go below the current enrolled count (${currentEnrolledCount})`
      : code);
    this.name = "ElectivesServiceError";
  }
}

function normalizeAcademicYear(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const match = /^([0-9]{4})(?:-([0-9]{2}|[0-9]{4}))?$/.exec(raw.trim());
  if (!match) throw new ElectivesServiceError("ELECTIVE_ACADEMIC_YEAR_INVALID");
  const start = Number(match[1]), next = start + 1, end = match[2];
  // Keep the persisted slot in the range supported by canonical DB02
  // cohort progression; otherwise the slot is impossible to join.
  if (start < 1900 || start > 9998)
    throw new ElectivesServiceError("ELECTIVE_ACADEMIC_YEAR_INVALID");
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
  await assertCollegeElectivesEnabled(context);
  if (program.collegeId !== input.collegeId) {
    throw new ElectivesServiceError("ELECTIVE_PROGRAM_COLLEGE_MISMATCH");
  }
  if (input.academicPeriodId) {
    const period = await loadAcademicPeriodScope(input.academicPeriodId);
    if (period.collegeId !== input.collegeId || period.status === "CLOSED") {
      throw new ElectivesServiceError("ELECTIVE_PERIOD_INVALID");
    }
  }
  return getDb().transaction(async tx => {
    await assertPersistedGroupActor(tx, context, { collegeId: input.collegeId, mode: "MANUAL" });
    const [slot] = await tx.insert(electiveSlots).values({
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
  });
}

export async function createElectiveOffering(context: RequestContext, raw: unknown) {
  const input = offeringInput.parse(raw);
  return getDb().transaction(async tx => {
    // Common slot lock serializes creation and elective membership policy.
    // The guided offerings GET exposes eligible deliveries; an admin chooses
    // one explicitly instead of silently inventing a course/class association.
    const [slot] = await tx.select().from(electiveSlots)
      .where(eq(electiveSlots.id, input.slotId)).for("update");
    if (!slot || slot.status !== "ACTIVE" || slot.deletedAt) {
      throw new ElectivesServiceError("ELECTIVE_SLOT_NOT_ACTIVE");
    }
    requirePermission(context, "academics.manage", { collegeId: slot.collegeId });
    await assertCollegeElectivesEnabled(context);
    await assertPersistedGroupActor(tx, context, { collegeId: slot.collegeId, mode: "MANUAL" });
    // Lock the slot first, then the group, matching the group kernel's order.
    // An unlinked course can be offered without requiring admins to create an
    // empty elective group separately.
    let group: typeof lmsGroups.$inferSelect | undefined;
    if (input.groupId) {
      [group] = await tx.select().from(lmsGroups)
        .where(eq(lmsGroups.id, input.groupId)).for("update");
      if (!group || group.ownerScope !== "COLLEGE" ||
          group.collegeId !== slot.collegeId || group.kind !== "ELECTIVE" ||
          group.deletedAt || !["DRAFT", "ACTIVE"].includes(group.status)) {
        throw new ElectivesServiceError("ELECTIVE_GROUP_SCOPE_MISMATCH");
      }
      const [roster] = await tx.select({ total: count() }).from(lmsGroupMembers)
        .where(and(eq(lmsGroupMembers.groupId, group.id),
          inArray(lmsGroupMembers.state, ["ACTIVE", "WAITLISTED", "REQUESTED"])));
      if (group.activeCount !== 0 || (roster?.total ?? 0) !== 0) {
        throw new ElectivesServiceError("ELECTIVE_GROUP_HAS_MEMBERS");
      }
    }
    const [course] = await tx.select({
      id: courses.id,
      collegeId: departments.collegeId,
      status: courses.status,
      enabled: courses.enabled,
      deletedAt: courses.deletedAt,
    }).from(courses)
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(eq(courses.id, input.courseId))
      .for("share", { of: courses }).limit(1);
    if (!course || course.collegeId !== slot.collegeId || course.status !== "ACTIVE" ||
        !course.enabled || course.deletedAt) {
      throw new ElectivesServiceError("ELECTIVE_COURSE_COLLEGE_MISMATCH");
    }
    if (!group) {
      const [created] = await tx.insert(lmsGroups).values({
        ownerScope: "COLLEGE", collegeId: slot.collegeId,
        kind: "ELECTIVE", status: "ACTIVE",
        name: (slot.name + " · " + input.courseId.slice(0, 8)).slice(0, 150),
        capacity: input.capacity, createdByUserId: context.user.id,
        createdByType: context.user.systemRoles.includes("SUPER_ADMIN") ? "SUPER_ADMIN" : "COLLEGE_ADMIN",
      }).returning();
      group = created;
    } else if (group.capacity !== input.capacity) {
      const [updated] = await tx.update(lmsGroups).set({
        capacity: input.capacity, version: group.version + 1, updatedAt: new Date(),
      }).where(eq(lmsGroups.id, group.id)).returning();
      group = updated;
    }
    if (!group) throw new ElectivesServiceError("ELECTIVE_GROUP_SCOPE_MISMATCH");
    let backedAcademicPeriodId: string | null = null;
    {
      const [delivery] = await tx.select({
        id: courseSectionDeliveries.id,
        courseId: courseOfferings.courseId,
        collegeId: departments.collegeId,
        offeringPeriodId: courseOfferings.academicPeriodId,
        offeringCohortId: courseOfferings.cohortId,
        offeringProgramId: cohorts.programId,
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
      // Retain the backed delivery/section link as the canonical class,
      // ensuring the old group/class/course/schedule associations point to
      // the same active program, period and enrolled cohort.
      if (!delivery || delivery.courseId !== course.id || delivery.collegeId !== slot.collegeId ||
          delivery.offeringType !== "ELECTIVE" || delivery.offeringStatus !== "ACTIVE" ||
          delivery.sectionStatus !== "ACTIVE" || delivery.endedAt !== null ||
          delivery.sectionCohortId !== delivery.offeringCohortId ||
          delivery.offeringProgramId !== slot.programId ||
          delivery.sectionPeriodId !== delivery.offeringPeriodId ||
          (slot.academicPeriodId !== null && slot.academicPeriodId !== delivery.offeringPeriodId)) {
        throw new ElectivesServiceError("ELECTIVE_DELIVERY_MISMATCH");
      }
      backedAcademicPeriodId=delivery.offeringPeriodId;
    }
    if(!backedAcademicPeriodId)
      throw new ElectivesServiceError("ELECTIVE_DELIVERY_MISMATCH");
    // Match the old one-step elective allocation: a roster-backed class is
    // created together with the elective offering under the same transaction.
    // The canonical section delivery remains the course/term authority.
    const [backedClass]=await tx.insert(groupBackedClassOfferings).values({
      academicPeriodId:backedAcademicPeriodId,
      rosterGroupId:group.id,
      name:(slot.name+" · "+course.id.slice(0,8)).slice(0,150),
      status:"ACTIVE",
    }).returning({id:groupBackedClassOfferings.id});
    if(!backedClass)
      throw new ElectivesServiceError("ELECTIVE_DELIVERY_MISMATCH");
    try {
      const [offering] = await tx.insert(electiveOfferings).values({
        slotId: slot.id, courseId: course.id, groupId: group.id,
        backedDeliveryId: input.backedDeliveryId,
        backedClassOfferingId:backedClass.id,
        capacity: input.capacity,
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
  const db=getDb();
  const rows=await db.select({
    offeringId: electiveOfferings.id,
    courseId: electiveOfferings.courseId,
    groupId: electiveOfferings.groupId,
    backedDeliveryId: electiveOfferings.backedDeliveryId,
    capacity: electiveOfferings.capacity,
    version: electiveOfferings.version,
    courseName: courses.name,
    courseCode: courses.code,
    status: electiveOfferings.status,
    backedClassId: sections.id,
    backedClassName: sections.name,
    legacyClassId: sections.legacyClassId,
    sectionStatus: sections.status,
    deliveryEndedAt: courseSectionDeliveries.endedAt,
    groupStatus: lmsGroups.status,
    activeMembers: lmsGroups.activeCount,
    waitlistedCount: sql<number>`(select count(*)::int from lms_group_members gm
      where gm.group_id = "lms_groups"."id" and gm.state = 'WAITLISTED')`,
  }).from(electiveOfferings)
    .innerJoin(lmsGroups, eq(lmsGroups.id, electiveOfferings.groupId))
    .innerJoin(courses, eq(courses.id, electiveOfferings.courseId))
    .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,electiveOfferings.backedDeliveryId))
    .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
    .where(and(eq(electiveOfferings.slotId, slotId),
      isNull(electiveOfferings.deletedAt)))
    .orderBy(asc(courses.name),asc(electiveOfferings.id));
  if(!rows.length)return [];
  const groupIds=[...new Set(rows.map(row=>row.groupId))];
  const deliveryIds=[...new Set(rows.map(row=>row.backedDeliveryId))];
  const [rosters,faculty]=await Promise.all([
    db.select({groupId:lmsGroupMembers.groupId,total:countDistinct(lmsGroupMembers.membershipId)})
      .from(lmsGroupMembers)
      .innerJoin(collegeMemberships,and(
        eq(collegeMemberships.id,lmsGroupMembers.membershipId),
        eq(collegeMemberships.collegeId,slot.collegeId),
        eq(collegeMemberships.status,"ACTIVE")))
      .where(and(inArray(lmsGroupMembers.groupId,groupIds),
        eq(lmsGroupMembers.state,"ACTIVE"),
        eq(lmsGroupMembers.memberType,"LEARNER")))
      .groupBy(lmsGroupMembers.groupId),
    db.select({
      deliveryId:courseTeachingAssignments.deliveryId,
      role:courseTeachingAssignments.role,
      membershipId:courseTeachingAssignments.membershipId,
      facultyName:users.displayName,
    }).from(courseTeachingAssignments)
      .innerJoin(collegeMemberships,and(
        eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
        eq(collegeMemberships.collegeId,slot.collegeId),
        eq(collegeMemberships.status,"ACTIVE")))
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(and(inArray(courseTeachingAssignments.deliveryId,deliveryIds),
        isNull(courseTeachingAssignments.endedAt)))
      .orderBy(asc(users.displayName),asc(courseTeachingAssignments.id)),
  ]);
  const learners=new Map(rosters.map(row=>[row.groupId,row.total]));
  const facultyByDelivery=new Map<string,Array<{membershipId:string;name:string;role:string}>>();
  for(const member of faculty){
    const list=facultyByDelivery.get(member.deliveryId)??[];
    if(!list.some(item=>item.membershipId===member.membershipId))
      list.push({membershipId:member.membershipId,
        name:member.facultyName?.trim()||"Unnamed faculty",role:member.role});
    facultyByDelivery.set(member.deliveryId,list);
  }
  return rows.map(row=>{
    const activeSeatCount=row.status==="ACTIVE"?(learners.get(row.groupId)??0):0;
    const capacity=row.capacity??null;
    const teachers=facultyByDelivery.get(row.backedDeliveryId)??[];
    return {...row,
      // A membership enrolled in more than one offering occupies one seat
      // in each. A slot-level distinct learner count is a separate metric.
      activeMembers:activeSeatCount,
      activeSeatEnrollments:activeSeatCount,
      seatsLeft:capacity===null?null:Math.max(0,capacity-activeSeatCount),
      capacityLabel:capacity===null?"No limit":String(capacity),
      faculty:teachers,facultyNames:teachers.map(item=>item.name),
      facultyCount:teachers.length,
      associatedClass:row.backedClassName,
      classAssociationValid:row.sectionStatus==="ACTIVE" &&
        row.deliveryEndedAt===null,
    };
  });
}

/** Legacy slot header distinguishes course seat enrollments from a learner
 * headcount. Each ACTIVE membership across any offered course is counted once
 * in uniqueLearners, while the sum of per-offering seats may be larger.
 */
export async function getElectiveSlotRosterSummary(
  context:RequestContext,slotIdInput:string,
) {
  const slotId=uuid.parse(slotIdInput);
  const [slot]=await getDb().select({
    id:electiveSlots.id,collegeId:electiveSlots.collegeId,
  }).from(electiveSlots).where(and(eq(electiveSlots.id,slotId),
    isNull(electiveSlots.deletedAt))).limit(1);
  if(!slot)throw new ElectivesServiceError("ELECTIVE_SLOT_NOT_FOUND");
  requirePermission(context,"academics.read",{collegeId:slot.collegeId});
  const db=getDb();
  const [summary]=await db.select({
    uniqueLearners:countDistinct(lmsGroupMembers.membershipId),
  }).from(lmsGroupMembers)
    .innerJoin(electiveOfferings,and(
      eq(electiveOfferings.groupId,lmsGroupMembers.groupId),
      eq(electiveOfferings.slotId,slotId),
      eq(electiveOfferings.status,"ACTIVE"),
      isNull(electiveOfferings.deletedAt)))
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,lmsGroupMembers.membershipId),
      eq(collegeMemberships.collegeId,slot.collegeId),
      eq(collegeMemberships.status,"ACTIVE")))
    .where(and(eq(lmsGroupMembers.state,"ACTIVE"),
      eq(lmsGroupMembers.memberType,"LEARNER")));
  const offerings=await listElectiveOfferings(context,slotId);
  return {uniqueLearners:summary?.uniqueLearners??0,
    seatEnrollments:offerings.reduce((n,row)=>n+row.activeSeatEnrollments,0),
    offeringCount:offerings.filter(row=>row.status==="ACTIVE").length,
    waitlistedRequests:offerings.reduce((n,row)=>n+
      (row.status==="ACTIVE"?row.waitlistedCount:0),0)};
}

/** Same-slot administrative transfer is transactional in the group kernel. */
export { moveElectiveMember as moveElectiveSelection } from "@/modules/groups/service";

const offeringEditInput = z.object({
  courseId: uuid,
  backedDeliveryId: uuid,
  capacity: z.number().int().positive().nullable(),
  expectedVersion: z.number().int().min(0),
});

/** Edit an offered course or its capacity without changing any enrolled learner's course.
 * Changing the course is forbidden once the roster has requests or enrollments. */
export async function updateCollegeElectiveOffering(
  context: RequestContext, rawSlotId: string, rawOfferingId: string, raw: unknown,
) {
  const slotId = uuid.parse(rawSlotId), offeringId = uuid.parse(rawOfferingId);
  const input = offeringEditInput.parse(raw);
  return getDb().transaction(async tx => {
    const [slot] = await tx.select().from(electiveSlots)
      .where(eq(electiveSlots.id, slotId)).for("update").limit(1);
    if (!slot || slot.status !== "ACTIVE" || slot.deletedAt)
      throw new ElectivesServiceError("ELECTIVE_SLOT_NOT_ACTIVE");
    requirePermission(context, "academics.manage", { collegeId: slot.collegeId });
    await assertCollegeElectivesEnabled(context);
    await assertPersistedGroupActor(tx, context, { collegeId: slot.collegeId, mode: "MANUAL" });
    const [offering] = await tx.select().from(electiveOfferings)
      .where(and(eq(electiveOfferings.id, offeringId), eq(electiveOfferings.slotId, slot.id),
        eq(electiveOfferings.status, "ACTIVE"), isNull(electiveOfferings.deletedAt)))
      .for("update").limit(1);
    if (!offering) throw new ElectivesServiceError("ELECTIVE_OFFERING_NOT_FOUND");
    if (offering.version !== input.expectedVersion)
      throw new ElectivesServiceError("ELECTIVE_OFFERING_STALE");
    const [group] = await tx.select().from(lmsGroups)
      .where(eq(lmsGroups.id, offering.groupId)).for("update").limit(1);
    if (!group || group.ownerScope !== "COLLEGE" || group.kind !== "ELECTIVE" ||
        group.collegeId !== slot.collegeId || group.deletedAt ||
        !["DRAFT", "ACTIVE"].includes(group.status))
      throw new ElectivesServiceError("ELECTIVE_GROUP_SCOPE_MISMATCH");
    if (input.capacity !== null && input.capacity < group.activeCount)
      throw new ElectivesServiceError("ELECTIVE_CAPACITY_BELOW_ENROLLMENT", group.activeCount);
    const courseChanged = offering.courseId !== input.courseId ||
      offering.backedDeliveryId !== input.backedDeliveryId;
    if (courseChanged) {
      const [roster] = await tx.select({ total: count() }).from(lmsGroupMembers)
        .where(and(eq(lmsGroupMembers.groupId, group.id),
          inArray(lmsGroupMembers.state, ["ACTIVE", "WAITLISTED", "REQUESTED"])));
      if ((roster?.total ?? 0) > 0)
        throw new ElectivesServiceError("ELECTIVE_COURSE_CHANGE_HAS_MEMBERS");
    }
    const [delivery] = await tx.select({
      courseId: courseOfferings.courseId,
      collegeId: departments.collegeId,
      offeringPeriodId: courseOfferings.academicPeriodId,
      offeringCohortId: courseOfferings.cohortId,
      offeringProgramId: cohorts.programId,
      offeringType: courseOfferings.type,
      offeringStatus: courseOfferings.status,
      sectionCohortId: sections.cohortId,
      sectionPeriodId: sections.academicPeriodId,
      sectionStatus: sections.status,
      courseStatus: courses.status,
      courseEnabled: courses.enabled,
      courseDeletedAt: courses.deletedAt,
      endedAt: courseSectionDeliveries.endedAt,
    }).from(courseSectionDeliveries)
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(sections, eq(sections.id, courseSectionDeliveries.sectionId))
      .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(eq(courseSectionDeliveries.id, input.backedDeliveryId))
      .for("share", { of: courses }).limit(1);
    // A course switch is safe only when the new backed delivery and its
    // section are in the same active college/program/academic period.
    if (!delivery || delivery.courseId !== input.courseId ||
        delivery.collegeId !== slot.collegeId || delivery.offeringProgramId !== slot.programId ||
        delivery.offeringType !== "ELECTIVE" || delivery.offeringStatus !== "ACTIVE" ||
        delivery.courseStatus !== "ACTIVE" || !delivery.courseEnabled ||
        delivery.courseDeletedAt !== null || delivery.sectionStatus !== "ACTIVE" ||
        delivery.endedAt !== null || delivery.sectionCohortId !== delivery.offeringCohortId ||
        delivery.sectionPeriodId !== delivery.offeringPeriodId ||
        (slot.academicPeriodId !== null && slot.academicPeriodId !== delivery.offeringPeriodId))
      throw new ElectivesServiceError("ELECTIVE_DELIVERY_MISMATCH");
    // GROUP_BACKED class identity is period-scoped. An elective rebind must
    // not leave the class directory on the old term while the new delivery
    // and timetable belong to another academic period.
    if (offering.backedClassOfferingId) {
      const [backedClass] = await tx.select({
        academicPeriodId: groupBackedClassOfferings.academicPeriodId,
      }).from(groupBackedClassOfferings)
        .where(and(
          eq(groupBackedClassOfferings.id, offering.backedClassOfferingId),
          eq(groupBackedClassOfferings.rosterGroupId, group.id),
          eq(groupBackedClassOfferings.status, "ACTIVE"),
        )).for("share").limit(1);
      if (!backedClass || backedClass.academicPeriodId !== delivery.offeringPeriodId)
        throw new ElectivesServiceError("ELECTIVE_DELIVERY_MISMATCH");
    }
    if (group.capacity !== input.capacity) {
      await tx.update(lmsGroups).set({
        capacity: input.capacity, version: group.version + 1, updatedAt: new Date(),
      }).where(eq(lmsGroups.id, group.id));
    }
    try {
      const [saved] = await tx.update(electiveOfferings).set({
        courseId: input.courseId, backedDeliveryId: input.backedDeliveryId,
        capacity: input.capacity, version: offering.version + 1, updatedAt: new Date(),
      }).where(and(eq(electiveOfferings.id, offering.id),
        eq(electiveOfferings.version, input.expectedVersion))).returning();
      if (!saved) throw new ElectivesServiceError("ELECTIVE_OFFERING_STALE");
      return saved;
    } catch (error) {
      const constraint = postgresConstraintName(error);
      if (constraint === "elective_offerings_slot_active_course_uq")
        throw new ElectivesServiceError("ELECTIVE_COURSE_ALREADY_OFFERED");
      if (constraint === "elective_offerings_delivery_uq")
        throw new ElectivesServiceError("ELECTIVE_DELIVERY_ALREADY_USED");
      throw error;
    }
  });
}

/** Keep enrolled history, but prevent further selection by archiving an offering. */
export async function archiveCollegeElectiveOffering(
  context: RequestContext, rawSlotId: string, rawOfferingId: string, rawExpectedVersion: unknown,
) {
  const slotId = uuid.parse(rawSlotId), offeringId = uuid.parse(rawOfferingId);
  const expectedVersion = z.number().int().min(0).parse(rawExpectedVersion);
  return getDb().transaction(async tx => {
    const [slot] = await tx.select().from(electiveSlots)
      .where(eq(electiveSlots.id, slotId)).for("update").limit(1);
    if (!slot || slot.status !== "ACTIVE" || slot.deletedAt)
      throw new ElectivesServiceError("ELECTIVE_SLOT_NOT_ACTIVE");
    requirePermission(context, "academics.manage", { collegeId: slot.collegeId });
    await assertCollegeElectivesEnabled(context);
    await assertPersistedGroupActor(tx, context, { collegeId: slot.collegeId, mode: "MANUAL" });
    const [offering] = await tx.select().from(electiveOfferings)
      .where(and(eq(electiveOfferings.id, offeringId),
        eq(electiveOfferings.slotId, slotId), isNull(electiveOfferings.deletedAt)))
      .for("update").limit(1);
    if (!offering) throw new ElectivesServiceError("ELECTIVE_OFFERING_NOT_FOUND");
    if (offering.version !== expectedVersion)
      throw new ElectivesServiceError("ELECTIVE_OFFERING_STALE");
    if (offering.status !== "ACTIVE")
      throw new ElectivesServiceError("ELECTIVE_OFFERING_ALREADY_ARCHIVED");
    const [saved] = await tx.update(electiveOfferings).set({
      status: "ARCHIVED", version: offering.version + 1, updatedAt: new Date(),
    }).where(and(eq(electiveOfferings.id, offeringId),
      eq(electiveOfferings.version, expectedVersion))).returning();
    if (!saved) throw new ElectivesServiceError("ELECTIVE_OFFERING_STALE");
    return saved;
  });
}
