import "server-only";

import { and, asc, count, eq, isNull, isNotNull, or, sql } from "drizzle-orm";
import { collegeFacultyAssignmentHistoryQuerySchema, facultyTeachingAssignmentState } from "./college-faculty-detail-model";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohorts, collegeMemberships, courseOfferings,
  courseSectionDeliveries, courseTeachingAssignments, courses, departments,
  facultyProfiles, membershipRoles, programs, sections, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  collegePersonIdSchema, CollegePersonNotFoundError,
} from "./college-person-detail-model";

export async function getCollegeFacultyDetail(
  context: RequestContext, membershipIdInput: unknown, rawQuery: unknown = {},
) {
  const membershipId = collegePersonIdSchema.parse(membershipIdInput);
  const filter=collegeFacultyAssignmentHistoryQuerySchema.parse(rawQuery);
  const owner = context.membership;
  if (!owner || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "people.manage", {collegeId: owner.collegeId, organizationId: owner.organizationId}))
    throw new AuthorizationError("people.manage");
  requirePermission(context, "people.manage", {
    collegeId: owner.collegeId, organizationId: owner.organizationId,
  });
  const db = getDb();
  const [person] = await db.select({
    id: collegeMemberships.id,
    name: users.displayName,
    status: collegeMemberships.status,
    academicTitle: facultyProfiles.academicTitle,
    employmentType: facultyProfiles.employmentType,
    departmentId: facultyProfiles.primaryDepartmentId,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "FACULTY"),
    ))
    .leftJoin(facultyProfiles, eq(facultyProfiles.membershipId, collegeMemberships.id))
    .where(and(
      eq(collegeMemberships.id, membershipId),
      eq(collegeMemberships.collegeId, owner.collegeId),
    )).limit(1);
  if (!person) throw new CollegePersonNotFoundError();

  const [department] = person.departmentId
    ? await db.select({ name: departments.name }).from(departments)
      .where(and(eq(departments.id, person.departmentId), eq(departments.collegeId, owner.collegeId)))
      .limit(1)
    : [];

  const base = db.select({
    id: sql<string>`${courseTeachingAssignments.id}`.as("assignment_id"),
    role: sql<string>`${courseTeachingAssignments.role}`.as("assignment_role"),
    startedAt: sql<Date>`${courseTeachingAssignments.startedAt}`.mapWith(courseTeachingAssignments.startedAt).as("assignment_started_at"),
    endedAt: sql<Date | null>`${courseTeachingAssignments.endedAt}`.mapWith(courseTeachingAssignments.endedAt).as("assignment_ended_at"),
    deliveryEndedAt: sql<Date | null>`${courseSectionDeliveries.endedAt}`.mapWith(courseSectionDeliveries.endedAt).as("delivery_ended_at"),
    offeringId: sql<string>`${courseOfferings.id}`.as("offering_id"),
    courseName: sql<string>`${courses.name}`.as("course_name"),
    courseCode: sql<string>`${courses.code}`.as("course_code"),
    cohortName: sql<string>`${cohorts.name}`.as("cohort_name"),
    sectionName: sql<string>`${sections.name}`.as("section_name"),
    periodName: sql<string>`${academicPeriods.name}`.as("period_name"),
    metadataIncomplete: sql<boolean>`
      ${courseSectionDeliveries.id} is null or ${courseOfferings.id} is null or
      ${courses.id} is null or ${departments.id} is null or
      ${cohorts.id} is null or ${programs.id} is null or
      ${sections.id} is null or ${academicPeriods.id} is null
    `.as("metadata_incomplete"),
  }).from(courseTeachingAssignments)
    .leftJoin(courseSectionDeliveries, eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
    .leftJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .leftJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(departments, and(
      eq(departments.id, courses.departmentId),
      eq(departments.collegeId, owner.collegeId),
    ))
    .leftJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
    .leftJoin(programs, eq(programs.id, cohorts.programId))
    .leftJoin(sections, and(
      eq(sections.id, courseSectionDeliveries.sectionId),
      eq(sections.cohortId, cohorts.id),
      eq(sections.academicPeriodId, courseOfferings.academicPeriodId),
    ))
    .leftJoin(academicPeriods, and(
      eq(academicPeriods.id, courseOfferings.academicPeriodId),
      eq(academicPeriods.collegeId, owner.collegeId),
    ))
    .where(eq(courseTeachingAssignments.membershipId, membershipId))
    .as("college_faculty_detail_assignments");

  const [totals, rows] = await Promise.all([
    db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${base.endedAt} is null and ${base.deliveryEndedAt} is null)`.mapWith(Number),
      distinctOfferings: sql<number>`count(distinct ${base.offeringId})`.mapWith(Number),
    }).from(base),
    db.select().from(base).where(and(
      filter.role === "ALL" ? undefined : eq(base.role,filter.role),
      filter.status === "ACTIVE" ? and(isNull(base.endedAt),isNull(base.deliveryEndedAt)) :
      filter.status === "ENDED" ? or(isNotNull(base.endedAt),isNotNull(base.deliveryEndedAt)) : undefined,
    )).orderBy(asc(base.courseName), asc(base.sectionName), asc(base.id)).limit(101),
  ]);
  const raw = rows.slice(0, 100);
  return {
    person: {
      id: person.id,
      name: person.name ?? "Unnamed faculty",
      status: person.status,
      academicTitle: person.academicTitle,
      employmentType: person.employmentType,
      departmentName: department?.name ?? null,
    },
    counts: {
      totalAssignments: totals[0]?.total ?? 0,
      activeAssignments: totals[0]?.active ?? 0,
      distinctOfferings: totals[0]?.distinctOfferings ?? 0,
    },
    filter,
    assignments: raw.map(row => ({
      ...row,
      // Keep an orphaned assignment visible to admins with explicit degraded metadata.
      courseName: row.courseName ?? "Unresolved course",
      courseCode: row.courseCode ?? null,
      cohortName: row.cohortName ?? "Unresolved cohort",
      sectionName: row.sectionName ?? "Unresolved section",
      periodName: row.periodName ?? "Unresolved academic period",
      metadataIncomplete: row.metadataIncomplete,
      status: facultyTeachingAssignmentState(row.endedAt, row.deliveryEndedAt),
    })),
    truncated: rows.length > 100,
  };
}
