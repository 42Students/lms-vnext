import "server-only";
import {alias} from "drizzle-orm/pg-core";
import {and,asc,count,eq,gte,lt,lte,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,sectionScheduleEvents,sections,cohorts,programs,departments,
 attendanceSessions,courseSectionDeliveries,courseOfferings,courses,courseTeachingAssignments,
 courseQuizzes,courseLessons,courseLearningPaths} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {z} from "zod";
import {istDayBounds,formatSuperAdminAttentionWhen} from "./admin-today-attention-model";
export async function getSuperAdminTodayBoard(ctx:RequestContext,rawCollegeId:string,now=new Date()){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");
 requirePermission(ctx,"admin-scope.select");
 const id=z.uuid().parse(rawCollegeId);
 const [college]=await getDb().select({organizationId:colleges.organizationId}).from(colleges)
  .where(and(eq(colleges.id,id),eq(colleges.status,"ACTIVE"))).limit(1);
 if(!college)throw new AuthorizationError("college.read");
 requirePermission(ctx,"college.read",{collegeId:id,organizationId:college.organizationId});
 const {from,to}=istDayBounds(now);
 // Seven *local calendar dates* including today, not a guessed UTC date range.
 const attendanceWindowFrom=new Date(from.getTime()-6*86400000);
 const markedSessions=alias(attendanceSessions,"admin_today_marked_sessions");
 const db=getDb();
 const [classes,pendingAttendance,withoutTeacher,closingQuizzes]=await Promise.all([
  db.select({
   scheduled:sql<number>`count(distinct ${sectionScheduleEvents.id})::int`,
   ended:sql<number>`count(distinct ${sectionScheduleEvents.id}) filter(where ${sectionScheduleEvents.endsAt}<=${now})::int`,
   marked:sql<number>`count(distinct ${sectionScheduleEvents.id}) filter(where ${attendanceSessions.status}='MARKED')::int`,
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
     gte(sectionScheduleEvents.startsAt,attendanceWindowFrom),
     lte(sectionScheduleEvents.endsAt,now),isNull(markedSessions.id))),
  db.select({n:count()}).from(courseSectionDeliveries)
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .leftJoin(courseTeachingAssignments,and(
    eq(courseTeachingAssignments.deliveryId,courseSectionDeliveries.id),
    eq(courseTeachingAssignments.role,"PRIMARY"),isNull(courseTeachingAssignments.endedAt)))
   .where(and(eq(departments.collegeId,id),eq(courseOfferings.status,"ACTIVE"),
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
 return {quizDeadlineLabels:deadlines
  .filter((item):item is {dueAt:Date}=>item.dueAt instanceof Date)
  .map(item=>formatSuperAdminAttentionWhen(item.dueAt)),
  classesScheduled:classes[0]?.scheduled??0,classesEnded:classes[0]?.ended??0,
  attendanceTaken:classes[0]?.marked??0,attendanceNotTaken:pendingAttendance[0]?.n??0,
  coursesWithoutTeacher:withoutTeacher[0]?.n??0,quizzesClosingThisWeek:closingQuizzes[0]?.n??0};
}
