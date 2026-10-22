import "server-only";
import {alias} from "drizzle-orm/pg-core";
import {and,asc,desc,count,eq,gte,lt,lte,isNull,min,ne,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,sectionScheduleEvents,sections,cohorts,programs,departments,
 attendanceSessions,courseSectionDeliveries,courseOfferings,courses,courseTeachingAssignments,
 courseQuizzes,courseLessons,courseLearningPaths,attendanceRecords,attendancePolicies,
 learnerProfiles,learnerProgramEnrollments,sectionEnrollments,collegeMemberships,users,
 assignmentSubmissions,courseAssignments,academicPeriods} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {z} from "zod";
import {istDayBounds,formatSuperAdminAttentionWhen,pendingAttendanceWindowStart} from "./admin-today-attention-model";
import {DEFAULT_ATTENDANCE_POLICY} from "@/modules/attendance/policy-validation";
export async function getSuperAdminTodayBoard(ctx:RequestContext,rawCollegeId:string,now=new Date()){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");
 requirePermission(ctx,"admin-scope.select");
 const id=z.uuid().parse(rawCollegeId);
 const [college]=await getDb().select({organizationId:colleges.organizationId}).from(colleges)
  .where(and(eq(colleges.id,id),eq(colleges.status,"ACTIVE"))).limit(1);
 if(!college)throw new AuthorizationError("college.read");
 requirePermission(ctx,"college.read",{collegeId:id,organizationId:college.organizationId});
 requirePermission(ctx,"academics.read",{collegeId:id,organizationId:college.organizationId});
 requirePermission(ctx,"courses.read",{collegeId:id,organizationId:college.organizationId});
 const {from,to}=istDayBounds(now);
 // Complete rolling seven days by end time, including sessions begun earlier.
 const attendanceWindowFrom=pendingAttendanceWindowStart(now);
 const markedSessions=alias(attendanceSessions,"admin_today_marked_sessions");
 const db=getDb();
 const [classes,pendingAttendance,withoutTeacher,closingQuizzes]=await Promise.all([
  db.select({
   scheduled:sql<number>`count(distinct ${sectionScheduleEvents.id})::int`,
   ended:sql<number>`count(distinct ${sectionScheduleEvents.id}) filter(where ${sectionScheduleEvents.endsAt}<=${now})::int`,
   marked:sql<number>`count(distinct ${sectionScheduleEvents.id}) filter(where ${attendanceSessions.status}='MARKED')::int`,
   held:sql<number>`count(distinct ${sectionScheduleEvents.id}) filter(where ${attendanceSessions.status}='MARKED')::int`,
  }).from(sectionScheduleEvents)
   .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .leftJoin(attendanceSessions,eq(attendanceSessions.scheduleEventId,sectionScheduleEvents.id))
   .where(and(eq(departments.collegeId,id),eq(sectionScheduleEvents.status,"SCHEDULED"),
    gte(sectionScheduleEvents.startsAt,from),lt(sectionScheduleEvents.startsAt,to))),
  // Previously only unmarked classes that ended *today* were counted.
  // This is the legacy trailing-seven-day pending attendance scope, limited
  // to non-cancelled scheduled events and with any MARKED session excluded.
  db.select({n:count()}).from(sectionScheduleEvents)
   .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .leftJoin(markedSessions,and(eq(markedSessions.scheduleEventId,sectionScheduleEvents.id),
     eq(markedSessions.status,"MARKED")))
   .where(and(eq(departments.collegeId,id),eq(sectionScheduleEvents.status,"SCHEDULED"),
     gte(sectionScheduleEvents.endsAt,attendanceWindowFrom),
     lte(sectionScheduleEvents.endsAt,now),isNull(markedSessions.scheduleEventId))),
  db.select({n:count()}).from(courseSectionDeliveries)
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
   .innerJoin(academicPeriods,eq(academicPeriods.id,courseOfferings.academicPeriodId))
   .leftJoin(courseTeachingAssignments,and(
    eq(courseTeachingAssignments.deliveryId,courseSectionDeliveries.id),
    eq(courseTeachingAssignments.role,"PRIMARY"),isNull(courseTeachingAssignments.endedAt)))
   .where(and(eq(departments.collegeId,id),eq(courseOfferings.status,"ACTIVE"),
    eq(courses.status,"ACTIVE"),eq(sections.status,"ACTIVE"),
    eq(academicPeriods.collegeId,id),eq(academicPeriods.status,"ACTIVE"),
    isNull(courseSectionDeliveries.endedAt),isNull(courseTeachingAssignments.id))),
  db.select({n:count()}).from(courseQuizzes)
   .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
   .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,id),eq(courseQuizzes.status,"PUBLISHED"),
    gte(courseQuizzes.dueAt,now),lte(courseQuizzes.dueAt,new Date(now.getTime()+7*86400000)))),
 ]);
 // Each displayed due date must come from a persisted quiz in this college.
 const deadlines=await db.select({dueAt:courseQuizzes.dueAt}).from(courseQuizzes)
  .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(and(eq(departments.collegeId,id),eq(courseQuizzes.status,"PUBLISHED"),
   gte(courseQuizzes.dueAt,now),
   lte(courseQuizzes.dueAt,new Date(now.getTime()+7*86400000))))
  .orderBy(asc(courseQuizzes.dueAt)).limit(3);

 // Legacy Today previews are independent, tenant-bound reads. The risk denominator
 // counts every MARKED class on each active learner roster; attendance_records
 // only stores non-present exceptions and must not be the starting relation.
 const [policyRow]=await db.select({
  threshold:attendancePolicies.eligibilityThresholdPercent,
 }).from(attendancePolicies).where(eq(attendancePolicies.collegeId,id)).limit(1);
 const attendanceThreshold=policyRow?.threshold??DEFAULT_ATTENDANCE_POLICY.eligibilityThresholdPercent;
 const riskFrom=new Date(from.getTime()-30*86400000);
 const marked=sql<number>`count(*)::int`;
 const attended=sql<number>`sum(case when ${attendanceRecords.id} is null or ${attendanceRecords.status} in ('PRESENT','LATE') then 1 else 0 end)::int`;
 const attendanceRiskSource=db.select({
  membershipId:collegeMemberships.id,displayName:users.displayName,
  rollNumber:learnerProfiles.rollNumber,
  className:sql<string>`min(${sections.name})`.as("risk_class"),
  held:marked.as("held"),attended:attended.as("attended"),
 }).from(sectionScheduleEvents)
  .innerJoin(attendanceSessions,and(
   eq(attendanceSessions.scheduleEventId,sectionScheduleEvents.id),
   eq(attendanceSessions.status,"MARKED")))
  .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
  .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,eq(departments.id,programs.departmentId))
  .innerJoin(sectionEnrollments,and(
   eq(sectionEnrollments.sectionId,sections.id),
   eq(sectionEnrollments.academicPeriodId,sections.academicPeriodId),
   eq(sectionEnrollments.status,"ACTIVE")))
  .innerJoin(learnerProgramEnrollments,and(
   eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
   eq(learnerProgramEnrollments.status,"ACTIVE")))
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
   eq(collegeMemberships.collegeId,id),
   eq(collegeMemberships.status,"ACTIVE")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE")))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .leftJoin(attendanceRecords,and(
   eq(attendanceRecords.scheduleEventId,sectionScheduleEvents.id),
   eq(attendanceRecords.membershipId,collegeMemberships.id)))
  .where(and(eq(departments.collegeId,id),
   eq(sectionScheduleEvents.status,"SCHEDULED"),
   gte(sectionScheduleEvents.startsAt,riskFrom),
   lte(sectionScheduleEvents.startsAt,now)))
  .groupBy(collegeMemberships.id,users.displayName,learnerProfiles.rollNumber)
  .having(sql`${marked} > 0 and 100 * ${attended} < ${attendanceThreshold} * ${marked}`)
  .as("super_admin_today_risk");
 const pendingFilter=and(eq(departments.collegeId,id),
  eq(sectionScheduleEvents.status,"SCHEDULED"),
  gte(sectionScheduleEvents.endsAt,attendanceWindowFrom),
  lte(sectionScheduleEvents.endsAt,now),isNull(markedSessions.scheduleEventId));
 const [riskTotals,riskPreview,pendingPreview,gradingTotals,gradingPreview,
  staffingPreview,setupBatch,setupSection,setupLearners,setupCourses,quizPreview]=await Promise.all([
  db.select({n:count()}).from(attendanceRiskSource),
  db.select().from(attendanceRiskSource)
   .orderBy(sql`100.0 * ${attendanceRiskSource.attended} / nullif(${attendanceRiskSource.held},0)`)
   .limit(8),
  db.select({title:sectionScheduleEvents.title,
   section:sections.name,startsAt:sectionScheduleEvents.startsAt,
   facultyName:users.displayName})
   .from(sectionScheduleEvents)
   .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .leftJoin(markedSessions,and(eq(markedSessions.scheduleEventId,sectionScheduleEvents.id),
    eq(markedSessions.status,"MARKED")))
   .leftJoin(collegeMemberships,eq(collegeMemberships.id,sectionScheduleEvents.facultyMembershipId))
   .leftJoin(users,eq(users.id,collegeMemberships.userId))
   .where(pendingFilter).orderBy(desc(sectionScheduleEvents.startsAt)).limit(8),
  db.select({n:count()}).from(assignmentSubmissions)
   .innerJoin(courseAssignments,eq(courseAssignments.id,assignmentSubmissions.assignmentId))
   .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,assignmentSubmissions.deliveryId))
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,id),
    eq(assignmentSubmissions.gradingStatus,"NOT_GRADED"),
    isNull(assignmentSubmissions.deletedAt))),
  db.select({courseName:courses.name,courseCode:courses.code,
   pending:count(),oldest:min(assignmentSubmissions.submittedAt)})
   .from(assignmentSubmissions)
   .innerJoin(courseAssignments,eq(courseAssignments.id,assignmentSubmissions.assignmentId))
   .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,assignmentSubmissions.deliveryId))
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,id),
    eq(assignmentSubmissions.gradingStatus,"NOT_GRADED"),
    isNull(assignmentSubmissions.deletedAt)))
   .groupBy(courses.id,courses.name,courses.code)
   .orderBy(desc(count()),asc(min(assignmentSubmissions.submittedAt))).limit(8),
  db.select({course:courses.name,section:sections.name,
   semester:academicPeriods.name})
   .from(courseSectionDeliveries)
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
   .innerJoin(academicPeriods,eq(academicPeriods.id,courseOfferings.academicPeriodId))
   .leftJoin(courseTeachingAssignments,and(
    eq(courseTeachingAssignments.deliveryId,courseSectionDeliveries.id),
    eq(courseTeachingAssignments.role,"PRIMARY"),
    isNull(courseTeachingAssignments.endedAt)))
   .where(and(eq(departments.collegeId,id),eq(courseOfferings.status,"ACTIVE"),
    eq(courses.status,"ACTIVE"),eq(sections.status,"ACTIVE"),
    eq(academicPeriods.status,"ACTIVE"),eq(academicPeriods.collegeId,id),
    isNull(courseSectionDeliveries.endedAt),isNull(courseTeachingAssignments.id)))
   .orderBy(asc(courses.name),asc(sections.name)).limit(8),
  db.select({n:count()}).from(cohorts)
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .leftJoin(sections,and(eq(sections.cohortId,cohorts.id),eq(sections.status,"ACTIVE")))
   .where(and(eq(departments.collegeId,id),ne(cohorts.status,"ARCHIVED"),isNull(sections.id))),
  db.select({n:count()}).from(sections)
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .leftJoin(sectionEnrollments,and(eq(sectionEnrollments.sectionId,sections.id),
    eq(sectionEnrollments.status,"ACTIVE")))
   .where(and(eq(departments.collegeId,id),
    eq(sections.status,"ACTIVE"),isNull(sectionEnrollments.id))),
  db.select({n:count()}).from(learnerProgramEnrollments)
   .innerJoin(collegeMemberships,
    eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
   .leftJoin(sectionEnrollments,and(
    eq(sectionEnrollments.learnerEnrollmentId,learnerProgramEnrollments.id),
    eq(sectionEnrollments.status,"ACTIVE")))
   .where(and(eq(collegeMemberships.collegeId,id),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(learnerProgramEnrollments.status,"ACTIVE"),isNull(sectionEnrollments.id))),
  db.select({n:count()}).from(courses)
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,id),eq(courses.status,"ACTIVE"),
    sql`not exists (select 1 from course_offerings co join course_learning_paths lp on lp.offering_id=co.id and lp.status <> 'ARCHIVED' join course_lessons cl on cl.learning_path_id=lp.id and cl.status='ACTIVE' where co.course_id=${courses.id} and co.status='ACTIVE')`)),
  db.select({title:courseQuizzes.title,course:courses.name,dueAt:courseQuizzes.dueAt,
   className:sql<string>`coalesce((select string_agg(distinct s.name, ', ') from course_section_deliveries d join sections s on s.id=d.section_id where d.offering_id=${courseOfferings.id} and d.ended_at is null),'All eligible classes')`})
   .from(courseQuizzes)
   .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
   .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,id),eq(courseQuizzes.status,"PUBLISHED"),
    gte(courseQuizzes.dueAt,now),lte(courseQuizzes.dueAt,new Date(now.getTime()+7*86400000))))
   .orderBy(asc(courseQuizzes.dueAt)).limit(8),
 ]);
 const setupGapRows=[
  {label:"Batches without classes",count:setupBatch[0]?.n??0,href:"/admin/batches"},
  {label:"Sections without students",count:setupSection[0]?.n??0,href:"/admin/classes"},
  {label:"Students not in a class",count:setupLearners[0]?.n??0,href:"/admin/people"},
  {label:"Courses without lessons",count:setupCourses[0]?.n??0,href:"/admin/courses"},
 ];
 const attendanceRiskRows=riskPreview.map(row=>({
  membershipId:row.membershipId,displayName:row.displayName,rollNumber:row.rollNumber,
  className:row.className,held:row.held,absent:row.held-row.attended,
  percent:row.held?Math.round(1000*row.attended/row.held)/10:0,
 }));
 return {
  quizDeadlineLabels:deadlines
   .filter((item):item is {dueAt:Date}=>item.dueAt instanceof Date)
   .map(item=>formatSuperAdminAttentionWhen(item.dueAt)),
  classesScheduled:classes[0]?.scheduled??0,classesEnded:classes[0]?.ended??0,
  classesHeld:classes[0]?.held??0,
  attendanceTaken:classes[0]?.marked??0,attendanceNotTaken:pendingAttendance[0]?.n??0,
  coursesWithoutTeacher:withoutTeacher[0]?.n??0,quizzesClosingThisWeek:closingQuizzes[0]?.n??0,
  attendanceThreshold,attendanceAtRisk:riskTotals[0]?.n??0,attendanceRiskRows,
  attendancePendingRows:pendingPreview.map(row=>({
   title:row.title,section:row.section,faculty:row.facultyName??"No faculty set",
   when:formatSuperAdminAttentionWhen(row.startsAt),
  })),
  gradingBacklog:gradingTotals[0]?.n??0,
  gradingRows:gradingPreview.map(row=>({
   course:row.courseName,code:row.courseCode,pending:row.pending,
   oldest:row.oldest?formatSuperAdminAttentionWhen(row.oldest):null,
  })),
  unstaffedRows:staffingPreview.map(row=>({
   course:row.course,section:row.section,semester:row.semester,
  })),
  setupGapRows,setupGaps:setupGapRows.reduce((sum,row)=>sum+row.count,0),
  dueQuizRows:quizPreview.map(row=>({
   title:row.title,course:row.course,section:row.className,
   when:row.dueAt?formatSuperAdminAttentionWhen(row.dueAt):null,
  })),
 };
}
