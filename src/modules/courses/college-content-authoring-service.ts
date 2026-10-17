import "server-only";
import {and,asc,eq,ne,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {academicPeriods,cohorts,courseLearningPaths,courseLessons,courseOfferings,courses,departments,lessonContents} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

/** College-only metadata for adding/scheduling link-based lesson content.
 * Never return private storage keys to the catalog or the editor. */
export async function getCollegeContentAuthoringOptions(ctx:RequestContext,kind:"YOUTUBE"|"LIVE_CLASS"|"RESOURCE"){
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
   eq(courseOfferings.status,"ACTIVE"),ne(courseLearningPaths.status,"ARCHIVED")))
 .orderBy(asc(courses.name),asc(courseLessons.name)).limit(250);
 const existing=await db.select({
  id:lessonContents.id,lessonId:lessonContents.lessonId,title:lessonContents.title,
  notes:lessonContents.notes,
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
  ne(lessonContents.status,"ARCHIVED")))
 .orderBy(asc(lessonContents.title)).limit(250);
 return {lessons,existing:existing.map(row=>({...row,
  // Published playback and meeting links remain private to their authorized flows.
  // The editor can update metadata without replacing a hidden URL.
  externalUrl:row.status==="DRAFT"?row.externalUrl:null,
  startsAt:row.startsAt?.toISOString()??null,endsAt:row.endsAt?.toISOString()??null}))};
}

/** College lesson creation: show every active offering, including those
 * without a learning path. The writer creates its path on demand. */
export async function getCollegeLessonAuthoringOptions(ctx:RequestContext){
 const membership=ctx.membership;
 if(!membership||!hasMembershipRole(ctx,"COLLEGE_ADMIN"))
  throw new AuthorizationError("courses.manage");
 requirePermission(ctx,"courses.manage",{
  collegeId:membership.collegeId,organizationId:membership.organizationId,
 });
 const db=getDb();
 const offerings=await db.select({
  offeringId:courseOfferings.id,courseName:courses.name,courseCode:courses.code,
  cohortName:cohorts.name,periodName:academicPeriods.name,
  pathId:courseLearningPaths.id,
 }).from(courseOfferings)
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),
    eq(departments.collegeId,membership.collegeId)))
  .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
  .innerJoin(academicPeriods,and(eq(academicPeriods.id,courseOfferings.academicPeriodId),
    eq(academicPeriods.collegeId,membership.collegeId)))
  .leftJoin(courseLearningPaths,and(eq(courseLearningPaths.offeringId,courseOfferings.id),
    ne(courseLearningPaths.status,"ARCHIVED")))
  .where(and(eq(courseOfferings.status,"ACTIVE"),eq(courses.status,"ACTIVE")))
  .orderBy(asc(courses.name),asc(cohorts.name),asc(academicPeriods.name))
  .limit(250);
 const ids=offerings.map(item=>item.pathId).filter((id):id is string=>Boolean(id));
 const lessonRows=ids.length?await db.select({
  pathId:courseLessons.learningPathId,sequence:courseLessons.sequence,
 }).from(courseLessons).where(and(
  inArray(courseLessons.learningPathId,ids),eq(courseLessons.status,"ACTIVE"),
 )):[];
 const nextByPath=new Map<string,number>();
 for(const item of lessonRows){
  nextByPath.set(item.pathId,Math.max(nextByPath.get(item.pathId)??0,item.sequence+1));
 }
 return offerings.map(item=>({
  ...item,nextSequence:item.pathId?nextByPath.get(item.pathId)??0:0,
 }));
}
