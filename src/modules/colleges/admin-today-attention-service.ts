import "server-only";
import {and,count,eq,gte,lt,lte,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,sectionScheduleEvents,sections,cohorts,programs,departments,
 attendanceSessions,courseSectionDeliveries,courseOfferings,courses,courseTeachingAssignments,
 courseQuizzes,courseLessons,courseLearningPaths} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {z} from "zod";
import {istDayBounds} from "./admin-today-attention-model";
export async function getSuperAdminTodayBoard(ctx:RequestContext,rawCollegeId:string,now=new Date()){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");
 requirePermission(ctx,"admin-scope.select");
 const id=z.uuid().parse(rawCollegeId);
 const [college]=await getDb().select({organizationId:colleges.organizationId}).from(colleges)
  .where(and(eq(colleges.id,id),eq(colleges.status,"ACTIVE"))).limit(1);
 if(!college)throw new AuthorizationError("college.read");
 requirePermission(ctx,"college.read",{collegeId:id,organizationId:college.organizationId});
 const {from,to}=istDayBounds(now);
 const db=getDb();
 const [classes,withoutTeacher,closingQuizzes]=await Promise.all([
  db.select({
   scheduled:sql<number>`count(*)::int`,
   ended:sql<number>`count(*) filter(where ${sectionScheduleEvents.endsAt}<=${now})::int`,
   marked:sql<number>`count(*) filter(where ${attendanceSessions.status}='MARKED')::int`,
   unmarked:sql<number>`count(*) filter(where ${sectionScheduleEvents.endsAt}<=${now}
      and (${attendanceSessions.status} is null or ${attendanceSessions.status}<>'MARKED'))::int`,
  }).from(sectionScheduleEvents)
   .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .leftJoin(attendanceSessions,eq(attendanceSessions.scheduleEventId,sectionScheduleEvents.id))
   .where(and(eq(departments.collegeId,id),eq(sectionScheduleEvents.status,"SCHEDULED"),
    gte(sectionScheduleEvents.startsAt,from),lt(sectionScheduleEvents.startsAt,to))),
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
 return {classesScheduled:classes[0]?.scheduled??0,classesEnded:classes[0]?.ended??0,
  attendanceTaken:classes[0]?.marked??0,attendanceNotTaken:classes[0]?.unmarked??0,
  coursesWithoutTeacher:withoutTeacher[0]?.n??0,quizzesClosingThisWeek:closingQuizzes[0]?.n??0};
}
