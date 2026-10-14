import "server-only";

import { and, asc, count, desc, eq, exists, ilike, inArray, isNull, not, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  learnerProfiles,
  facultyProfiles,
  users,
  cohorts,
  departments,
  programs,
  learnerProgramEnrollments,
  sectionEnrollments,
  sections,
  courseTeachingAssignments,
  courseSectionDeliveries,
  courseOfferings,
  courses,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_ROLE_DIRECTORY_PAGE_SIZE,
  collegeRoleDirectoryQuerySchema,
  type CollegeDirectoryKind,
  type CollegeRoleDirectoryRow,
} from "./college-role-directory-model";

function escapedSearch(value: string) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

/** A College Admin sees role memberships in their *current* college only. */
export async function listCollegeRoleDirectory(
  context: RequestContext,
  kind: CollegeDirectoryKind,
  rawFilter: unknown,
) {
  const filter = collegeRoleDirectoryQuerySchema.parse(rawFilter);
  if (
    !context.membership ||
    !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    context.user.platformStatus !== "ACTIVE"
  ) {
    throw new AuthorizationError("people.manage");
  }
  const collegeId = context.membership.collegeId;
  requirePermission(context, "people.manage", {
    organizationId: context.membership.organizationId,
    collegeId,
  });

  if (kind === "FACULTY" && filter.enrollment !== "ALL") {
    throw new RangeError("FACULTY_ENROLLMENT_FILTER_UNSUPPORTED");
  }
  if (kind === "LEARNER" && filter.teaching !== "ALL") {
    throw new RangeError("LEARNER_TEACHING_FILTER_UNSUPPORTED");
  }
  const db = getDb();
  const activeEnrollment = exists(db.select({ enrollmentId: learnerProgramEnrollments.id })
    .from(learnerProgramEnrollments)
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, collegeMemberships.id),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    )));
  const matchesLearnerIdentity = (search: string) => exists(db.select({ member: learnerProfiles.membershipId })
    .from(learnerProfiles).where(and(
      eq(learnerProfiles.membershipId, collegeMemberships.id),
      or(ilike(learnerProfiles.rollNumber, search), ilike(learnerProfiles.registrationNumber, search)),
    )));
  const matchesFacultyIdentity = (search: string) => exists(db.select({ member: facultyProfiles.membershipId })
    .from(facultyProfiles)
    .leftJoin(departments, and(eq(departments.id, facultyProfiles.primaryDepartmentId), eq(departments.collegeId,collegeId)))
    .where(and(eq(facultyProfiles.membershipId, collegeMemberships.id),or(
      ilike(facultyProfiles.academicTitle,search),
      ilike(facultyProfiles.employmentType,search),
      ilike(departments.name,search),
    ))));
  const activeTeaching = exists(db.select({ assignmentId: courseTeachingAssignments.id })
    .from(courseTeachingAssignments)
    .innerJoin(courseSectionDeliveries, and(
      eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId),
      isNull(courseSectionDeliveries.endedAt),
    ))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, and(eq(departments.id, courses.departmentId), eq(departments.collegeId, collegeId)))
    .where(and(eq(courseTeachingAssignments.membershipId, collegeMemberships.id),
      isNull(courseTeachingAssignments.endedAt))));
  const query = db.select({
    membershipId: collegeMemberships.id,
    name: users.displayName,
    email: users.email,
    membershipStatus: collegeMemberships.status,
    userStatus: users.platformStatus,
    joinedAt: collegeMemberships.createdAt,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, kind),
    ))
    .where(and(
      eq(collegeMemberships.collegeId, collegeId),
      filter.status === "ALL"
        ? undefined
        : eq(collegeMemberships.status, filter.status),
      filter.accountStatus === "ALL" ? undefined : eq(users.platformStatus, filter.accountStatus),
      kind !== "LEARNER" || filter.enrollment === "ALL" ? undefined :
        filter.enrollment === "ACTIVE" ? activeEnrollment : not(activeEnrollment),
      kind !== "FACULTY" || filter.teaching === "ALL" ? undefined :
        filter.teaching === "ASSIGNED" ? activeTeaching : not(activeTeaching),
      filter.q ? or(
        ilike(users.displayName, escapedSearch(filter.q)),
        ilike(users.email, escapedSearch(filter.q)),
        kind === "LEARNER" ? matchesLearnerIdentity(escapedSearch(filter.q)) : undefined,
        kind === "FACULTY" ? matchesFacultyIdentity(escapedSearch(filter.q)) : undefined,
      ) : undefined,
    )).as("college_role_directory");

  const [counts, baseRows] = await Promise.all([
    db.select({ total: count() }).from(query),
    db.select().from(query)
      .orderBy(
        filter.sort === "NEWEST" ? desc(query.joinedAt) :
          filter.sort === "OLDEST" ? asc(query.joinedAt) : asc(query.name),
        asc(query.membershipId),
      )
      .limit(COLLEGE_ROLE_DIRECTORY_PAGE_SIZE)
      .offset((filter.page - 1) * COLLEGE_ROLE_DIRECTORY_PAGE_SIZE),
  ]);
  const ids = baseRows.map((item) => item.membershipId);
  const academic = kind === "LEARNER" && ids.length
    ? await db.select({
        membershipId: learnerProgramEnrollments.membershipId,
        enrollmentId: learnerProgramEnrollments.id,
        programName: programs.name,
        cohortName: cohorts.name,
      }).from(learnerProgramEnrollments)
        .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
        .innerJoin(cohorts, and(
          eq(cohorts.id, learnerProgramEnrollments.cohortId),
          eq(cohorts.programId, programs.id),
        ))
        .innerJoin(departments, and(
          eq(departments.id, programs.departmentId),
          eq(departments.collegeId, collegeId),
        ))
        .where(and(
          inArray(learnerProgramEnrollments.membershipId, ids),
          eq(learnerProgramEnrollments.status, "ACTIVE"),
        ))
    : [];
  const enrollIds = academic.map((item) => item.enrollmentId);
  const activeSections = enrollIds.length
    ? await db.select({
        enrollmentId: sectionEnrollments.learnerEnrollmentId,
        sectionName: sections.name,
      }).from(sectionEnrollments)
        .innerJoin(sections, and(
          eq(sections.id, sectionEnrollments.sectionId),
          eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
          eq(sections.status, "ACTIVE"),
        ))
        .innerJoin(learnerProgramEnrollments, and(
          eq(learnerProgramEnrollments.id, sectionEnrollments.learnerEnrollmentId),
          eq(learnerProgramEnrollments.cohortId, sections.cohortId),
          eq(learnerProgramEnrollments.status, "ACTIVE"),
        ))
        .where(and(
          inArray(sectionEnrollments.learnerEnrollmentId, enrollIds),
          eq(sectionEnrollments.status, "ACTIVE"),
        ))
    : [];
  const facultyAssignments = kind === "FACULTY" && ids.length
    ? await db.select({
        membershipId: courseTeachingAssignments.membershipId,
        total: count(),
      }).from(courseTeachingAssignments)
        .innerJoin(courseSectionDeliveries, and(
          eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId),
          isNull(courseSectionDeliveries.endedAt),
        ))
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .innerJoin(departments, and(
          eq(departments.id, courses.departmentId),
          eq(departments.collegeId, collegeId),
        ))
        .where(and(
          inArray(courseTeachingAssignments.membershipId, ids),
          isNull(courseTeachingAssignments.endedAt),
        ))
        .groupBy(courseTeachingAssignments.membershipId)
    : [];
  const academicMap = new Map(academic.map((item) => [item.enrollmentId, item]));
  const sectionsByMembership = new Map<string, string[]>();
  for (const section of activeSections) {
    const enrollment = academicMap.get(section.enrollmentId);
    if (!enrollment) continue;
    const current = sectionsByMembership.get(enrollment.membershipId) ?? [];
    current.push(section.sectionName);
    sectionsByMembership.set(enrollment.membershipId, current);
  }
  const studentByMembership = new Map(academic.map((item) => [item.membershipId, item]));
  const teachingCount = new Map(facultyAssignments.map((item) => [item.membershipId, item.total]));
  const items: CollegeRoleDirectoryRow[] = baseRows.map((person) => {
    const study = studentByMembership.get(person.membershipId);
    return {
      membershipId: person.membershipId,
      name: person.name?.trim() || "Unnamed member",
      email: person.email,
      membershipStatus: person.membershipStatus,
      userStatus: person.userStatus,
      joinedAt: person.joinedAt,
      program: study?.programName ?? null,
      cohort: study?.cohortName ?? null,
      sections: sectionsByMembership.get(person.membershipId) ?? [],
      activeTeachingAssignments: teachingCount.get(person.membershipId) ?? 0,
    };
  });
  const total = counts[0]?.total ?? 0;
  return {
    kind, filter, items, total,
    pageSize: COLLEGE_ROLE_DIRECTORY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / COLLEGE_ROLE_DIRECTORY_PAGE_SIZE)),
  };
}
