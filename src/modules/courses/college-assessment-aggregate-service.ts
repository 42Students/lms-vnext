import "server-only";

import { and, asc, count, countDistinct, desc, eq, exists, ilike, inArray, isNull, isNotNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { alias } from "drizzle-orm/pg-core";
import {
  academicPeriods,
  cohorts,
  programs,
  assignmentSubmissions,
  collegeMemberships,
  courseSectionDeliveries,
  sectionEnrollments,
  learnerProgramEnrollments,
  membershipRoles,
  sections,
  courseAssignments,
  courseLearningPaths,
  courseLessons,
  courseOfferings,
  courseQuizzes,
  courses,
  departments,
  quizAttempts,
  users,
} from "@/db/schema";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_ASSESSMENT_PAGE_SIZE,
  parseCollegeAssessmentQuery,
  type CollegeAssessmentAggregateItem,
  type CollegeAssessmentKind,
} from "./college-assessment-aggregate-model";

const cohortDepartment = alias(departments,"assessment_cohort_department");

function textPattern(value: string) {
  return "%" + value.replace(/[\\%_]/g, "\\$&") + "%";
}

type AssessmentRow = Omit<
  CollegeAssessmentAggregateItem,
  "deliverySpecific" | "activityCount" | "resultsPublished" | "eligibleLearners" | "submittedLearners" | "gradedLearners" | "resultsReleaseReady"
> & { deliveryId: string | null; resultsPublished?: boolean | null };

export async function listCollegeAssessmentAggregate(
  context: RequestContext,
  kind: CollegeAssessmentKind,
  rawQuery: unknown,
) {
  // A legacy administrator may supply an integer legacy course ID or a
  // native UUID. Resolve it only inside the persisted college-scoped JOIN;
  // neither caller-provided courseId nor collegeId is an authorization grant.
  const raw=rawQuery&&typeof rawQuery==="object"&&!Array.isArray(rawQuery)?
   rawQuery as Record<string,unknown>:{};
  const {courseId:rawCourseId,...modernQuery}=raw;
  const query=parseCollegeAssessmentQuery(kind,modernQuery);
  let courseUuid:string|null=null,legacyCourseId:number|null=null;
  if(rawCourseId!==undefined){
   const id=String(rawCourseId);
   if(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)){
    courseUuid=id;
   }else if(/^[1-9][0-9]{0,9}$/.test(id)&&Number.isSafeInteger(Number(id))){
    legacyCourseId=Number(id);
   }else throw new Error("Invalid course ID");
  }
  let collegeId: string;
  if (isSuperAdmin(context) && !context.adminScope?.collegeId)
    throw new AuthorizationError("courses.read");
  if (isSuperAdmin(context) && context.adminScope?.collegeId) {
    // Read-only Super Admin path; never resolve from a stale membership.
    collegeId = context.adminScope.collegeId;
    requirePermission(context, "courses.read", {
      collegeId, organizationId: context.adminScope.organizationId,
    });
  } else {
    if (
      !context.membership ||
      !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      context.membership.status !== "ACTIVE" ||
      context.user.platformStatus !== "ACTIVE"
    ) {
      throw new AuthorizationError("courses.read");
    }
    collegeId = context.membership.collegeId;
    requirePermission(context, "courses.read", {
      collegeId, organizationId: context.membership.organizationId,
    });
  }

  const db = getDb();
  // Authorized filter options come from the selected college, not the
  // current paginated assessment rows.
  const [directoryCourses,directorySections]=await Promise.all([
    db.selectDistinct({code:courses.code,name:courses.name}).from(courses)
      .innerJoin(departments,eq(departments.id,courses.departmentId))
      .where(and(eq(departments.collegeId,collegeId),eq(courses.status,"ACTIVE")))
      .orderBy(asc(courses.name),asc(courses.code)),
    db.selectDistinct({
      courseCode:courses.code,deliveryId:courseSectionDeliveries.id,
      sectionName:sections.name,sectionCode:sections.code,
    }).from(courseSectionDeliveries)
      .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
      .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
      .innerJoin(departments,eq(departments.id,courses.departmentId))
      .innerJoin(sections,and(
        eq(sections.id,courseSectionDeliveries.sectionId),
        eq(sections.cohortId,courseOfferings.cohortId),
        eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
      ))
      .where(and(
        eq(departments.collegeId,collegeId),eq(courses.status,"ACTIVE"),
        eq(courseOfferings.status,"ACTIVE"),eq(sections.status,"ACTIVE"),
        isNull(courseSectionDeliveries.endedAt),
      ))
      .orderBy(asc(courses.code),asc(sections.name),asc(sections.code)),
  ]);
  // Deliberately keep the two Drizzle roots statically typed. Both are
  // registered, and neither page consults draft assessment storage tables.
  let rows: AssessmentRow[];
  let total: number;
  if (kind === "ASSIGNMENT") {
    const conditions = and(
      eq(departments.collegeId, collegeId),
      query.status === "ALL" ? undefined :
        eq(courseAssignments.status, query.status as "DRAFT" | "PUBLISHED" | "ARCHIVED"),
      query.courseCode ? eq(courses.code,query.courseCode) : undefined,
      courseUuid?eq(courses.id,courseUuid):undefined,
      legacyCourseId!==null?eq(courses.legacyCourseId,legacyCourseId):undefined,
      query.deliveryId ? or(
        eq(courseAssignments.deliveryId,query.deliveryId),
        and(isNull(courseAssignments.deliveryId),exists(
          db.select({id:courseSectionDeliveries.id}).from(courseSectionDeliveries)
            .where(and(eq(courseSectionDeliveries.id,query.deliveryId),
              eq(courseSectionDeliveries.offeringId,courseOfferings.id),
              isNull(courseSectionDeliveries.endedAt))),
        )),
      ) : undefined,
      query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
      query.cohortCode ? eq(cohorts.code,query.cohortCode) : undefined,
      query.programCode ? eq(programs.code,query.programCode) : undefined,
      query.scope==="SHARED"?isNull(courseAssignments.deliveryId):
        query.scope==="SECTION"?isNotNull(courseAssignments.deliveryId):undefined,
      query.duePresence==="SCHEDULED"?isNotNull(courseAssignments.dueAt):
        query.duePresence==="UNSCHEDULED"?isNull(courseAssignments.dueAt):undefined,
      query.dueWindow==="PAST"?sql`${courseAssignments.dueAt} < now()`:
        query.dueWindow==="FUTURE"?sql`${courseAssignments.dueAt} >= now()`:undefined,
      query.q ? ilike(courseAssignments.title, textPattern(query.q)) : undefined,
    );
    const scoped = db.select({
      id: sql<string>`${courseAssignments.id}`.mapWith(courseAssignments.id).as("assessment_id"),
      title: courseAssignments.title,
      courseName: sql<string>`${courses.name}`.mapWith(courses.name).as("course_name_alias"),
      courseCode: courses.code,
      lessonName: sql<string>`${courseLessons.name}`.mapWith(courseLessons.name).as("lesson_name_alias"),
      lessonId:courseLessons.id,
      offeringId: sql<string>`${courseOfferings.id}`.mapWith(courseOfferings.id).as("offering_id_alias"),
      status: courseAssignments.status,
      dueAt: courseAssignments.dueAt,
      deliveryId: courseAssignments.deliveryId,
      points: courseAssignments.maxPoints,
      facultyId:courseAssignments.createdByUserId,
      updatedAt:courseAssignments.updatedAt,
      courseId:courses.id,
    }).from(courseAssignments)
      .innerJoin(courseLessons, eq(courseLessons.id, courseAssignments.lessonId))
      .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(cohortDepartment,and(eq(cohortDepartment.id,programs.departmentId),eq(cohortDepartment.collegeId,collegeId)))
      .innerJoin(academicPeriods, and(eq(academicPeriods.id,courseOfferings.academicPeriodId),eq(academicPeriods.collegeId,collegeId)))
      .where(conditions).as("college_assignment_scope");
    const [totals, items] = await Promise.all([
      db.select({ total: count() }).from(scoped),
      db.select().from(scoped)
        .orderBy(desc(scoped.dueAt), asc(scoped.title), asc(scoped.id))
        .limit(COLLEGE_ASSESSMENT_PAGE_SIZE)
        .offset((query.page - 1) * COLLEGE_ASSESSMENT_PAGE_SIZE),
    ]);
    total = totals[0]?.total ?? 0;
    rows = items;
  } else {
    const conditions = and(
      eq(departments.collegeId, collegeId),
      query.status === "ALL" ? undefined :
        eq(courseQuizzes.status, query.status),
      query.courseCode ? eq(courses.code,query.courseCode) : undefined,
      courseUuid?eq(courses.id,courseUuid):undefined,
      legacyCourseId!==null?eq(courses.legacyCourseId,legacyCourseId):undefined,
      query.deliveryId ? or(
        eq(courseQuizzes.deliveryId,query.deliveryId),
        and(isNull(courseQuizzes.deliveryId),exists(
          db.select({id:courseSectionDeliveries.id}).from(courseSectionDeliveries)
            .where(and(eq(courseSectionDeliveries.id,query.deliveryId),
              eq(courseSectionDeliveries.offeringId,courseOfferings.id),
              isNull(courseSectionDeliveries.endedAt))),
        )),
      ) : undefined,
      query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
      query.cohortCode ? eq(cohorts.code,query.cohortCode) : undefined,
      query.programCode ? eq(programs.code,query.programCode) : undefined,
      query.scope==="SHARED"?isNull(courseQuizzes.deliveryId):
        query.scope==="SECTION"?isNotNull(courseQuizzes.deliveryId):undefined,
      query.duePresence==="SCHEDULED"?isNotNull(courseQuizzes.dueAt):
        query.duePresence==="UNSCHEDULED"?isNull(courseQuizzes.dueAt):undefined,
      query.dueWindow==="PAST"?sql`${courseQuizzes.dueAt} < now()`:
        query.dueWindow==="FUTURE"?sql`${courseQuizzes.dueAt} >= now()`:undefined,
      query.results!=="ALL"?eq(courseQuizzes.resultsPublished,query.results==="PUBLISHED"):undefined,
      query.q ? ilike(courseQuizzes.title, textPattern(query.q)) : undefined,
    );
    const scoped = db.select({
      id: sql<string>`${courseQuizzes.id}`.mapWith(courseQuizzes.id).as("assessment_id"),
      title: courseQuizzes.title,
      courseName: sql<string>`${courses.name}`.mapWith(courses.name).as("course_name_alias"),
      courseCode: courses.code,
      lessonName: sql<string>`${courseLessons.name}`.mapWith(courseLessons.name).as("lesson_name_alias"),
      lessonId:courseLessons.id,
      offeringId: sql<string>`${courseOfferings.id}`.mapWith(courseOfferings.id).as("offering_id_alias"),
      status: courseQuizzes.status,
      dueAt: courseQuizzes.dueAt,
      deliveryId: courseQuizzes.deliveryId,
      points: courseQuizzes.totalPoints,
      facultyId:courseQuizzes.createdByUserId,
      updatedAt:courseQuizzes.updatedAt,
      courseId:courses.id,
      resultsPublished: courseQuizzes.resultsPublished,
      createdAt: courseQuizzes.createdAt,
    }).from(courseQuizzes)
      .innerJoin(courseLessons, eq(courseLessons.id, courseQuizzes.lessonId))
      .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(cohortDepartment,and(eq(cohortDepartment.id,programs.departmentId),eq(cohortDepartment.collegeId,collegeId)))
      .innerJoin(academicPeriods, and(eq(academicPeriods.id,courseOfferings.academicPeriodId),eq(academicPeriods.collegeId,collegeId)))
      .where(conditions).as("college_quiz_scope");
    const [totals, items] = await Promise.all([
      db.select({ total: count() }).from(scoped),
      db.select().from(scoped)
        .orderBy(desc(scoped.createdAt), desc(scoped.id))
        .limit(COLLEGE_ASSESSMENT_PAGE_SIZE)
        .offset((query.page - 1) * COLLEGE_ASSESSMENT_PAGE_SIZE),
    ]);
    total = totals[0]?.total ?? 0;
    rows = items;
  }

  // The only IDs used for counting come from the authorized, paginated
  // college-filtered result. Quiz counts are attempts (not unique learners).
  const ids = rows.map((row) => row.id);
  // Query costs are bounded by one 20-item scope page, plus one grouped
  // activity count, eligible-roster and submission-aggregate batch each.
  // Never N+1 query individual assignment/quiz statistics.
  const statisticsStatus:"READY"|"UNAVAILABLE"="READY";
  const counts = ids.length === 0 ? [] :
    kind === "ASSIGNMENT" ?
      await db.select({
        id: assignmentSubmissions.assignmentId,
        total: count(),
      }).from(assignmentSubmissions)
        .where(inArray(assignmentSubmissions.assignmentId, ids))
        .groupBy(assignmentSubmissions.assignmentId) :
      await db.select({
        id: quizAttempts.quizId,
        total: count(),
      }).from(quizAttempts)
        .where(inArray(quizAttempts.quizId, ids))
        .groupBy(quizAttempts.quizId);
  const countById = new Map(counts.map((row) => [row.id, row.total]));

  // Count actual active learners in each offering delivery, not persisted
  // activity rows. Shared items count the eligible audiences across deliveries.
  // All source IDs are restricted to the authorized, paginated assessment rows.
  const offeringIds = [...new Set(rows.map(row => row.offeringId))];
  const eligibleRows = offeringIds.length ? await db.select({
    offeringId: courseSectionDeliveries.offeringId,
    deliveryId: courseSectionDeliveries.id,
    eligible: countDistinct(collegeMemberships.id),
    members:sql<string[]>`array_agg(distinct ${collegeMemberships.id})`,
  }).from(courseSectionDeliveries)
    .innerJoin(courseOfferings, eq(courseOfferings.id,courseSectionDeliveries.offeringId))
    .innerJoin(sections, and(
      eq(sections.id,courseSectionDeliveries.sectionId),
      eq(sections.status,"ACTIVE"),
      eq(sections.cohortId,courseOfferings.cohortId),
      eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
    ))
    .innerJoin(sectionEnrollments,and(
      eq(sectionEnrollments.sectionId,sections.id),
      eq(sectionEnrollments.academicPeriodId,sections.academicPeriodId),
      eq(sectionEnrollments.status,"ACTIVE"),
    ))
    .innerJoin(learnerProgramEnrollments,and(
      eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
      eq(learnerProgramEnrollments.cohortId,courseOfferings.cohortId),
      eq(learnerProgramEnrollments.status,"ACTIVE"),
    ))
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
      eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
    ))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER"),
    ))
    .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
    .where(and(inArray(courseSectionDeliveries.offeringId,offeringIds),
      isNull(courseSectionDeliveries.endedAt)))
    .groupBy(courseSectionDeliveries.offeringId,courseSectionDeliveries.id):[];
  // Section selector for College Admin's authorized assignment review drawer.
  // A shared assignment may be submitted in several active course Sections.
  const reviewDeliveries=offeringIds.length?
    await db.select({
      offeringId:courseSectionDeliveries.offeringId,
      deliveryId:courseSectionDeliveries.id,
      sectionName:sections.name,
      sectionCode:sections.code,
    }).from(courseSectionDeliveries)
      .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
      .innerJoin(sections,and(
        eq(sections.id,courseSectionDeliveries.sectionId),
        eq(sections.cohortId,courseOfferings.cohortId),
        eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
      ))
      .where(and(inArray(courseSectionDeliveries.offeringId,offeringIds),
        eq(courseOfferings.status,"ACTIVE"),
        isNull(courseSectionDeliveries.endedAt),
        eq(sections.status,"ACTIVE")))
      .orderBy(asc(sections.name),asc(sections.code)):[];
  const eligibleByOfferingMembers=new Map<string,Set<string>>();
  const eligibleByDelivery=new Map<string,number>();
  for(const entry of eligibleRows){
    const audience=eligibleByOfferingMembers.get(entry.offeringId)??new Set<string>();
    for(const member of entry.members)audience.add(member);
    eligibleByOfferingMembers.set(entry.offeringId,audience);
    eligibleByDelivery.set(entry.deliveryId,entry.eligible);
  }
  const eligibleByOffering=new Map<string,number>(
    [...eligibleByOfferingMembers].map(([id,ids])=>[id,ids.size] as const));

  // Count only submissions from currently active learners in the actual
  // section delivery; resubmissions and repeat quiz attempts count once.
  const submissionStats = ids.length === 0 ? [] :
    kind === "ASSIGNMENT" ?
      await db.select({
        id:assignmentSubmissions.assignmentId,
        submitted:countDistinct(assignmentSubmissions.membershipId),
        graded:sql<number>`count(distinct ${assignmentSubmissions.membershipId}) filter (where ${assignmentSubmissions.gradingStatus} = 'GRADED')::int`,
      }).from(assignmentSubmissions)
        .innerJoin(courseSectionDeliveries,and(
          eq(courseSectionDeliveries.id,assignmentSubmissions.deliveryId),
          isNull(courseSectionDeliveries.endedAt),
        ))
        .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
        .innerJoin(sectionEnrollments,and(
          eq(sectionEnrollments.sectionId,courseSectionDeliveries.sectionId),
          eq(sectionEnrollments.academicPeriodId,courseOfferings.academicPeriodId),
          eq(sectionEnrollments.status,"ACTIVE"),
        ))
        .innerJoin(learnerProgramEnrollments,and(
          eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
          eq(learnerProgramEnrollments.membershipId,assignmentSubmissions.membershipId),
          eq(learnerProgramEnrollments.cohortId,courseOfferings.cohortId),
          eq(learnerProgramEnrollments.status,"ACTIVE"),
        ))
        .innerJoin(collegeMemberships,and(
          eq(collegeMemberships.id,assignmentSubmissions.membershipId),
          eq(collegeMemberships.collegeId,collegeId),
          eq(collegeMemberships.status,"ACTIVE"),
        ))
        .innerJoin(membershipRoles,and(
          eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"LEARNER"),
        ))
        .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
        .where(inArray(assignmentSubmissions.assignmentId,ids))
        .groupBy(assignmentSubmissions.assignmentId) :
      await db.select({
        id:quizAttempts.quizId,
        submitted:countDistinct(quizAttempts.membershipId),
        graded:sql<number>`0::int`,
      }).from(quizAttempts)
        .innerJoin(courseSectionDeliveries,and(
          eq(courseSectionDeliveries.id,quizAttempts.deliveryId),
          isNull(courseSectionDeliveries.endedAt),
        ))
        .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
        .innerJoin(sectionEnrollments,and(
          eq(sectionEnrollments.sectionId,courseSectionDeliveries.sectionId),
          eq(sectionEnrollments.academicPeriodId,courseOfferings.academicPeriodId),
          eq(sectionEnrollments.status,"ACTIVE"),
        ))
        .innerJoin(learnerProgramEnrollments,and(
          eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
          eq(learnerProgramEnrollments.membershipId,quizAttempts.membershipId),
          eq(learnerProgramEnrollments.cohortId,courseOfferings.cohortId),
          eq(learnerProgramEnrollments.status,"ACTIVE"),
        ))
        .innerJoin(collegeMemberships,and(
          eq(collegeMemberships.id,quizAttempts.membershipId),
          eq(collegeMemberships.collegeId,collegeId),
          eq(collegeMemberships.status,"ACTIVE"),
        ))
        .innerJoin(membershipRoles,and(
          eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"LEARNER"),
        ))
        .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
        .where(inArray(quizAttempts.quizId,ids))
        .groupBy(quizAttempts.quizId);
  const statsById=new Map(submissionStats.map(item=>[item.id,item]));
  const reportInstant=new Date();
  const items: CollegeAssessmentAggregateItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    courseName: row.courseName,
    courseCode: row.courseCode,
    lessonName: row.lessonName,
    lessonId:row.lessonId,
    facultyId:row.facultyId,
    updatedAt:row.updatedAt,
    sectionName:row.deliveryId?reviewDeliveries.find(item=>item.deliveryId===row.deliveryId)?.sectionName??null:null,
    offeringId: row.offeringId,
    status: row.status,
    dueAt: row.dueAt,
    deliverySpecific: row.deliveryId !== null,
    deliveryId:row.deliveryId,
    points: row.points,
    activityCount: countById.get(row.id) ?? 0,
    eligibleLearners:row.deliveryId?
      eligibleByDelivery.get(row.deliveryId)??0:
      eligibleByOffering.get(row.offeringId)??0,
    submittedLearners:statsById.get(row.id)?.submitted??0,
    gradedLearners:statsById.get(row.id)?.graded??0,
    resultsPublished: kind==="QUIZ" ? row.resultsPublished ?? false : null,
    // Releasing grades before the deadline would reveal protected answers.
    // A previously published CLOSED quiz can still be hidden by its manager.
    resultsReleaseReady:kind==="QUIZ"&&(
      (row.status==="CLOSED"&&row.resultsPublished===true) ||
      (row.dueAt!==null&&row.dueAt<=reportInstant&&
        (row.status==="CLOSED"||row.status==="PUBLISHED"))
    ),
  }));
  return {
    kind,
    collegeId,
    query,
    // The resolved IDs are filters only, never part of the acting role.
    courseIdFilter:courseUuid??legacyCourseId,
    items,
    reviewDeliveries,
    directoryCourses,
    directorySections,
    total,
    page: query.page,
    pageSize: COLLEGE_ASSESSMENT_PAGE_SIZE,
    statisticsStatus,
    legacyPage: {
      success:true,
      message:kind==="QUIZ"?"Quizzes retrieved successfully":"Assignments retrieved successfully",
      data:{
        content:items.map(item=>({
          id:item.id,title:item.title,courseName:item.courseName,
          lessonId:item.lessonId,facultyId:item.facultyId,updatedAt:item.updatedAt,
          sectionName:item.sectionName,deliveryId:item.deliveryId,
          status:item.status,dueAt:item.dueAt,
          totalPoints:item.points,resultsPublished:item.resultsPublished,
        })),
        page:query.page-1,
        size:COLLEGE_ASSESSMENT_PAGE_SIZE,
        totalElements:total,
        totalPages:Math.max(1,Math.ceil(total/COLLEGE_ASSESSMENT_PAGE_SIZE)),
      },
    },
    totalPages: Math.max(1, Math.ceil(total / COLLEGE_ASSESSMENT_PAGE_SIZE)),
  };
}
