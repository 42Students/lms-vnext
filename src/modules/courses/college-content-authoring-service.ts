import "server-only";
import {and,asc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,courseLearningPaths,courseLessons,courseOfferings,courses,departments,lessonContents} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

/** College-only metadata for adding/scheduling link-based lesson content.
 * Never return private storage keys to the catalog or the editor. */
export async function getCollegeContentAuthoringOptions(ctx:RequestContext,kind:"YOUTUBE"|"LIVE_CLASS"){
 const membership=ctx.membership;
 if(!membership||!hasMembershipRole(ctx,"COLLEGE_ADMIN"))
  throw new AuthorizationError("courses.manage");
 requirePermission(ctx,"courses.manage",{collegeId:membership.collegeId,
  organizationId:membership.organizationId});
 const collegeId=membership.collegeId;
 const db=getDb();
 const lessons=await db.select({
  id:courseLessons.id,name:courseLessons.name,course:courses.name,
  courseCode:courses.code,offeringId:courseOfferings.id,
 }).from(courseLessons)
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,and(eq(departments.id,courses.departmentId),
  eq(departments.collegeId,collegeId)))
 .where(and(eq(courseLessons.status,"ACTIVE"),eq(courses.status,"ACTIVE"),
   eq(courseOfferings.status,"ACTIVE")))
 .orderBy(asc(courses.name),asc(courseLessons.name)).limit(250);
 const existing=await db.select({
  id:lessonContents.id,lessonId:lessonContents.lessonId,title:lessonContents.title,
  externalUrl:lessonContents.externalUrl,durationSeconds:lessonContents.durationSeconds,
  startsAt:lessonContents.startsAt,endsAt:lessonContents.endsAt,
  status:lessonContents.status,sequence:lessonContents.sequence,
 }).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,and(eq(departments.id,courses.departmentId),
  eq(departments.collegeId,collegeId)))
 .where(and(eq(lessonContents.contentType,kind),
  eq(lessonContents.status,"DRAFT")))
 .orderBy(asc(lessonContents.title)).limit(250);
 return {lessons,existing:existing.map(row=>({...row,
  startsAt:row.startsAt?.toISOString()??null,endsAt:row.endsAt?.toISOString()??null}))};
}
