import "server-only";
import {and,asc,eq,ne,inArray,max,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {academicPeriods,cohorts,courseLearningPaths,courseLessons,courseOfferings,courseSectionDeliveries,sections,courses,departments,lessonContents} from "@/db/schema";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

/** College-only metadata for adding/scheduling link-based lesson content.
 * Never return private storage keys to the catalog or the editor. */
export async function getCollegeContentAuthoringOptions(ctx:RequestContext,kind:"YOUTUBE"|"LIVE_CLASS"|"RESOURCE"){
 const membership=ctx.membership;
 const superAdmin=isSuperAdmin(ctx);
 if(!superAdmin&&(!membership||membership.status!=="ACTIVE"||
    ctx.user.platformStatus!=="ACTIVE"||!hasMembershipRole(ctx,"COLLEGE_ADMIN")))
  throw new AuthorizationError("courses.manage");
 const acting=superAdmin?await resolveActingCollege(ctx,"courses.manage"):null;
 const collegeId=acting?.collegeId??membership!.collegeId;
 const organizationId=acting?.organizationId??membership!.organizationId;
 requirePermission(ctx,"courses.manage",{collegeId,organizationId});
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
 const deliveries=await db.select({deliveryId:courseSectionDeliveries.id,offeringId:courseOfferings.id,
  sectionName:sections.name,sectionCode:sections.code}).from(courseSectionDeliveries)
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
  .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),eq(sections.cohortId,courseOfferings.cohortId),eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
  .where(and(eq(sections.status,"ACTIVE"),eq(courseOfferings.status,"ACTIVE"),
   eq(courses.status,"ACTIVE"),isNull(courseSectionDeliveries.endedAt)))
  .orderBy(asc(sections.name)).limit(2000);
 const existing=await db.select({
  id:lessonContents.id,lessonId:lessonContents.lessonId,title:lessonContents.title,
  offeringId:courseOfferings.id,lessonName:courseLessons.name,courseCode:courses.code,
  deliveryId:lessonContents.deliveryId,
  notes:lessonContents.notes,
  externalUrl:lessonContents.externalUrl,durationSeconds:lessonContents.durationSeconds,
  startsAt:lessonContents.startsAt,endsAt:lessonContents.endsAt,
  status:lessonContents.status,sequence:lessonContents.sequence,
  visibleToStudents:lessonContents.visibleToStudents,
 }).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,and(eq(departments.id,courses.departmentId),
  eq(departments.collegeId,collegeId)))
 .where(and(eq(lessonContents.contentType,kind),
  ne(lessonContents.status,"ARCHIVED"),
  ne(courseLearningPaths.status,"ARCHIVED"),eq(courseOfferings.status,"ACTIVE"),
  eq(courses.status,"ACTIVE")))
 .orderBy(asc(courseLessons.name),asc(lessonContents.sequence),asc(lessonContents.title),asc(lessonContents.id)).limit(251);
 const positions=lessons.length?await db.select({lessonId:lessonContents.lessonId,highest:max(lessonContents.sequence)})
  .from(lessonContents).where(inArray(lessonContents.lessonId,lessons.map(row=>row.id)))
  .groupBy(lessonContents.lessonId):[];
 const nextByLesson=new Map(positions.map(row=>[row.lessonId,(row.highest??-1)+1]));
 return {deliveries,lessons:lessons.map(row=>({...row,nextSequence:nextByLesson.get(row.id)??0})),existingTruncated:existing.length>250,existing:existing.slice(0,250).map(row=>({...row,
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
