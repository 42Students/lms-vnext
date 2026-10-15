import "server-only";

import { and, asc, count, desc, eq, exists, gte, ilike, inArray, isNull, lt, not, or, sql } from "drizzle-orm";
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
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import {
  collegeRoleDirectoryQuerySchema,
  assertCompatibleCollegeRoleDirectoryFilters,
  roleDirectoryDateWindowValid,
  roleDirectoryIstDayStart,
  roleDirectoryNextIstDayStart,
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
  if (!roleDirectoryDateWindowValid(filter)) throw new RangeError("INVALID_ROLE_DIRECTORY_DATE_WINDOW");
  assertCompatibleCollegeRoleDirectoryFilters(kind,filter);
  if (
    !context.membership ||
    !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    context.user.platformStatus !== "ACTIVE"
  ) {
    throw new AuthorizationError("people.manage");
  }
  const actorMembership = context.membership;
  const collegeId = actorMembership.collegeId;
  requirePermission(context, "people.manage", {
    organizationId: actorMembership.organizationId,
    collegeId,
  });

  if (kind === "FACULTY" && filter.programId) {
    throw new RangeError("FACULTY_PROGRAM_FILTER_UNSUPPORTED");
  }
  if (kind === "FACULTY" && filter.cohortId) {
    throw new RangeError("FACULTY_COHORT_FILTER_UNSUPPORTED");
  }
  if (kind === "FACULTY" && filter.classPresence !== "ALL") {
    throw new RangeError("FACULTY_CLASS_FILTER_UNSUPPORTED");
  }
  if (kind === "FACULTY" && filter.registrationPresence !== "ALL") {
    throw new RangeError("FACULTY_REGISTRATION_FILTER_UNSUPPORTED");
  }
  if (kind === "FACULTY" && filter.rollPresence !== "ALL") {
    throw new RangeError("FACULTY_ROLL_FILTER_UNSUPPORTED");
  }
  if (kind === "FACULTY" && filter.enrollment !== "ALL") {
    throw new RangeError("FACULTY_ENROLLMENT_FILTER_UNSUPPORTED");
  }
  if (kind === "LEARNER" && filter.teachingRole !== "ALL") {
    throw new RangeError("LEARNER_TEACHING_ROLE_UNSUPPORTED");
  }
  if (kind === "LEARNER" && filter.teaching !== "ALL") {
    throw new RangeError("LEARNER_TEACHING_FILTER_UNSUPPORTED");
  }
  if (kind === "LEARNER" && filter.employmentType) {
    throw new RangeError("LEARNER_EMPLOYMENT_FILTER_UNSUPPORTED");
  }
  if (kind === "LEARNER" && filter.departmentPresence !== "ALL") {
    throw new RangeError("LEARNER_PRIMARY_DEPARTMENT_FILTER_UNSUPPORTED");
  }
  if (kind === "LEARNER" && filter.titlePresence !== "ALL") {
    throw new RangeError("LEARNER_ACADEMIC_TITLE_FILTER_UNSUPPORTED");
  }
  if (kind === "LEARNER" && filter.facultyDepartmentId) {
    throw new RangeError("LEARNER_FACULTY_DEPARTMENT_FILTER_UNSUPPORTED");
  }
  return getDb().transaction(async db => {
  const checked = await assertPersistedPlatformPermission(db, context, "people.manage", {
    collegeId,
    organizationId: actorMembership.organizationId,
  });
  if (!checked.membership || checked.membership.id !== actorMembership.id ||
      checked.membership.collegeId !== collegeId ||
      !checked.membership.roles.includes("COLLEGE_ADMIN")) {
    throw new AuthorizationError("people.manage");
  }
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
  const assignedClass = exists(db.select({ enrollmentId: sectionEnrollments.id })
    .from(sectionEnrollments)
    .innerJoin(learnerProgramEnrollments, and(
      eq(learnerProgramEnrollments.id, sectionEnrollments.learnerEnrollmentId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    ))
    .innerJoin(sections, and(
      eq(sections.id, sectionEnrollments.sectionId),
      eq(sections.cohortId, learnerProgramEnrollments.cohortId),
      eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
      eq(sections.status, "ACTIVE"),
    ))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, and(eq(programs.id, cohorts.programId), eq(programs.id, learnerProgramEnrollments.programId)))
    .innerJoin(departments, and(eq(departments.id, programs.departmentId), eq(departments.collegeId, collegeId)))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, collegeMemberships.id),
      eq(sectionEnrollments.status, "ACTIVE"),
    )));
  const belongsToProgram = filter.programId ? exists(db.select({enrollmentId:learnerProgramEnrollments.id})
    .from(learnerProgramEnrollments).innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
    .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),eq(learnerProgramEnrollments.programId,filter.programId),eq(learnerProgramEnrollments.status,"ACTIVE")))) : undefined;
  const belongsToCohort = filter.cohortId ? exists(db.select({enrollmentId:learnerProgramEnrollments.id})
    .from(learnerProgramEnrollments)
    .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),eq(cohorts.programId,learnerProgramEnrollments.programId)))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
    .where(and(
      eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
      eq(learnerProgramEnrollments.cohortId,filter.cohortId),
      eq(learnerProgramEnrollments.status,"ACTIVE"),
    ))) : undefined;
  const hasRoll = exists(db.select({ memberId: learnerProfiles.membershipId })
    .from(learnerProfiles).where(and(
      eq(learnerProfiles.membershipId, collegeMemberships.id),
      sql`nullif(btrim(${learnerProfiles.rollNumber}), '') is not null`,
    )));
  const hasRegistration = exists(db.select({ memberId: learnerProfiles.membershipId })
    .from(learnerProfiles).where(and(
      eq(learnerProfiles.membershipId, collegeMemberships.id),
      sql`nullif(btrim(${learnerProfiles.registrationNumber}), '') is not null`,
    )));
  const matchesLearnerIdentity = (search: string) => exists(db.select({ member: learnerProfiles.membershipId })
    .from(learnerProfiles).where(and(
      eq(learnerProfiles.membershipId, collegeMemberships.id),
      or(ilike(learnerProfiles.rollNumber, search), ilike(learnerProfiles.registrationNumber, search)),
    )));
  const matchesLearnerProgram = (search: string) => exists(db.select({enrollmentId:learnerProgramEnrollments.id})
    .from(learnerProgramEnrollments)
    .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),eq(cohorts.programId,programs.id)))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
    .where(and(
      eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
      eq(learnerProgramEnrollments.status,"ACTIVE"),
      or(ilike(programs.name,search),ilike(programs.code,search),
        ilike(cohorts.name,search),ilike(cohorts.code,search)),
    )));
  const matchesFacultyIdentity = (search: string) => exists(db.select({ member: facultyProfiles.membershipId })
    .from(facultyProfiles)
    .leftJoin(departments, and(eq(departments.id, facultyProfiles.primaryDepartmentId), eq(departments.collegeId,collegeId)))
    .where(and(eq(facultyProfiles.membershipId, collegeMemberships.id),or(
      ilike(facultyProfiles.academicTitle,search),
      ilike(facultyProfiles.employmentType,search),
      ilike(departments.name,search),
    ))));
  const hasAcademicTitle = exists(db.select({ memberId: facultyProfiles.membershipId })
    .from(facultyProfiles).where(and(
      eq(facultyProfiles.membershipId, collegeMemberships.id),
      sql`nullif(btrim(${facultyProfiles.academicTitle}), '') is not null`,
    )));
  const hasPrimaryDepartment = exists(db.select({ memberId: facultyProfiles.membershipId })
    .from(facultyProfiles)
    .innerJoin(departments,and(
      eq(departments.id,facultyProfiles.primaryDepartmentId),
      eq(departments.collegeId,collegeId),
    ))
    .where(eq(facultyProfiles.membershipId,collegeMemberships.id)));
  const matchesEmployment = filter.employmentType ? exists(db.select({membershipId:facultyProfiles.membershipId})
    .from(facultyProfiles)
    .where(and(eq(facultyProfiles.membershipId,collegeMemberships.id),
      eq(facultyProfiles.employmentType,filter.employmentType)))) : undefined;
  const facultyInDepartment = filter.facultyDepartmentId ? exists(db.select({member:facultyProfiles.membershipId})
    .from(facultyProfiles)
    .innerJoin(departments,and(eq(departments.id,facultyProfiles.primaryDepartmentId),eq(departments.collegeId,collegeId)))
    .where(and(eq(facultyProfiles.membershipId,collegeMemberships.id),eq(departments.id,filter.facultyDepartmentId)))) : undefined;
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
      isNull(courseTeachingAssignments.endedAt),
      filter.teachingRole === "ALL" ? undefined : eq(courseTeachingAssignments.role,filter.teachingRole),
    )));
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
      filter.joinedFrom ? gte(collegeMemberships.createdAt,roleDirectoryIstDayStart(filter.joinedFrom)) : undefined,
      filter.joinedThrough ? lt(collegeMemberships.createdAt,roleDirectoryNextIstDayStart(filter.joinedThrough)) : undefined,
      kind === "FACULTY" ? facultyInDepartment : undefined,
      kind === "FACULTY" && filter.titlePresence !== "ALL"
        ? (filter.titlePresence === "PRESENT" ? hasAcademicTitle : not(hasAcademicTitle)) : undefined,
      kind === "FACULTY" && filter.departmentPresence !== "ALL"
        ? (filter.departmentPresence === "ASSIGNED" ? hasPrimaryDepartment : not(hasPrimaryDepartment)) : undefined,
      kind === "LEARNER" && filter.rollPresence !== "ALL"
        ? (filter.rollPresence === "PRESENT" ? hasRoll : not(hasRoll)) : undefined,
      kind === "LEARNER" && filter.registrationPresence !== "ALL"
        ? (filter.registrationPresence === "PRESENT" ? hasRegistration : not(hasRegistration)) : undefined,
      kind === "FACULTY" ? matchesEmployment : undefined,
      kind === "LEARNER" ? belongsToCohort : undefined,
      kind === "LEARNER" ? belongsToProgram : undefined,
      kind === "LEARNER" && filter.classPresence !== "ALL"
        ? (filter.classPresence === "ASSIGNED" ? assignedClass : not(assignedClass)) : undefined,
      kind !== "LEARNER" || filter.enrollment === "ALL" ? undefined :
        filter.enrollment === "ACTIVE" ? activeEnrollment : not(activeEnrollment),
      kind === "FACULTY" && filter.teachingRole !== "ALL" ? activeTeaching : undefined,
      kind !== "FACULTY" || filter.teaching === "ALL" ? undefined :
        filter.teaching === "ASSIGNED" ? activeTeaching : not(activeTeaching),
      filter.q ? or(
        ilike(users.displayName, escapedSearch(filter.q)),
        ilike(users.email, escapedSearch(filter.q)),
        kind === "LEARNER" ? matchesLearnerIdentity(escapedSearch(filter.q)) : undefined,
        kind === "LEARNER" ? matchesLearnerProgram(escapedSearch(filter.q)) : undefined,
        kind === "FACULTY" ? matchesFacultyIdentity(escapedSearch(filter.q)) : undefined,
      ) : undefined,
    )).as("college_role_directory");

  const [counts, baseRows] = await Promise.all([
    db.select({ total: count() }).from(query),
    db.select().from(query)
      .orderBy(
        filter.sort === "NEWEST" ? desc(query.joinedAt) :
          filter.sort === "OLDEST" ? asc(query.joinedAt) :
          filter.sort === "NAME_DESC" ? desc(sql`lower(coalesce(${query.name}, ''))`) :
          asc(sql`lower(coalesce(${query.name}, ''))`),
        asc(query.membershipId),
      )
      .limit(filter.pageSize)
      .offset((filter.page - 1) * filter.pageSize),
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
  const departmentRows = kind === "FACULTY" ? await db.select({id:departments.id,name:departments.name})
    .from(departments).where(and(eq(departments.collegeId,collegeId),isNull(departments.archivedAt)))
    .orderBy(asc(departments.name),asc(departments.id)).limit(201) : [];
  const programRows = kind === "LEARNER" ? await db.select({id:programs.id,name:programs.name})
    .from(programs).innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
    .orderBy(asc(programs.name),asc(programs.id)).limit(201) : [];
  const cohortRows = kind === "LEARNER" ? await db.select({id:cohorts.id,name:cohorts.name,programName:programs.name})
    .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
    .orderBy(asc(programs.name),asc(cohorts.name),asc(cohorts.id)).limit(201) : [];
  const employmentRows = kind === "FACULTY" ? await db.selectDistinct({employmentType:facultyProfiles.employmentType})
    .from(facultyProfiles).innerJoin(collegeMemberships,eq(collegeMemberships.id,facultyProfiles.membershipId))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"FACULTY")))
    .where(eq(collegeMemberships.collegeId,collegeId))
    .orderBy(asc(facultyProfiles.employmentType)).limit(101) : [];
  const employmentOptions=employmentRows.map(row=>row.employmentType).filter((value):value is string=>Boolean(value)).slice(0,100);
  return {
    kind, filter, items, total,
    employmentOptions,
    employmentOptionsTruncated:employmentRows.length>100,
    programOptions:programRows.slice(0,200),
    programOptionsTruncated:programRows.length>200,
    cohortOptions:cohortRows.slice(0,200),
    cohortOptionsTruncated:cohortRows.length>200,
    departmentOptions:departmentRows.slice(0,200),
    departmentOptionsTruncated:departmentRows.length>200,
    pageSize: filter.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filter.pageSize)),
  };
  });
}
