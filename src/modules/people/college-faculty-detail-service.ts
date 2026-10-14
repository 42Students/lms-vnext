import "server-only";

import { and, asc, count, eq, sql } from "drizzle-orm";
import { facultyTeachingAssignmentState } from "./college-faculty-detail-model";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohorts, collegeMemberships, courseOfferings,
  courseSectionDeliveries, courseTeachingAssignments, courses, departments,
  facultyProfiles, membershipRoles, programs, sections, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  collegePersonIdSchema, collegePersonDetailQuerySchema, CollegePersonNotFoundError,
} from "./college-person-detail-model";

export async function getCollegeFacultyDetail(
  context: RequestContext, membershipIdInput: unknown, rawQuery: unknown = {},
) {
  const membershipId = collegePersonIdSchema.parse(membershipIdInput);
  collegePersonDetailQuerySchema.parse(rawQuery);
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
    id: courseTeachingAssignments.id,
    role: courseTeachingAssignments.role,
    startedAt: courseTeachingAssignments.startedAt,
    endedAt: courseTeachingAssignments.endedAt,
    deliveryEndedAt: courseSectionDeliveries.endedAt,
    offeringId: courseOfferings.id,
    courseName: courses.name,
    courseCode: courses.code,
    cohortName: cohorts.name,
    sectionName: sections.name,
    periodName: academicPeriods.name,
  }).from(courseTeachingAssignments)
    .innerJoin(courseSectionDeliveries, eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, and(
      eq(departments.id, courses.departmentId),
      eq(departments.collegeId, owner.collegeId),
    ))
    .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(sections, and(
      eq(sections.id, courseSectionDeliveries.sectionId),
      eq(sections.cohortId, cohorts.id),
      eq(sections.academicPeriodId, courseOfferings.academicPeriodId),
    ))
    .innerJoin(academicPeriods, and(
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
    db.select().from(base).orderBy(asc(base.courseName), asc(base.sectionName), asc(base.id)).limit(101),
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
    assignments: raw.map(row => ({
      ...row,
      status: facultyTeachingAssignmentState(row.endedAt, row.deliveryEndedAt),
    })),
    truncated: rows.length > 100,
  };
}
