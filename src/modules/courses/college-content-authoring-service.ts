import "server-only";
import {and,asc,eq,ne,inArray,max,isNull,or,ilike} from "drizzle-orm";
import {getDb} from "@/db/client";
import {academicPeriods,cohorts,courseLearningPaths,courseLessons,courseOfferings,courseSectionDeliveries,sections,courses,departments,lessonContents} from "@/db/schema";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

export type CollegeExistingContentFilters={
 courseId?:string;lessonId?:string;sectionId?:string;search?:string;page?:number;
};
export function collegeExistingContentFiltersFromSearch(
 params:Record<string,string|string[]|undefined>,
):CollegeExistingContentFilters{
 const get=(key:string)=>typeof params[key]==="string"?params[key] as string:"";
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const courseId=get("existingCourse"),lessonId=get("existingLesson");
 const sectionId=get("existingSection"),search=get("existingSearch").trim();
 const page=Number(get("existingPage")||"1");
 if([courseId,lessonId,sectionId].some(id=>id&&!uuid.test(id))||
    search.length>100||!Number.isSafeInteger(page)||page<1||page>10000)
  throw new Error("INVALID_EXISTING_CONTENT_FILTER");
 return {courseId,lessonId,sectionId,search,page};
}

/** College-only metadata for adding/scheduling link-based lesson content.
 * Never return private storage keys to the catalog or the editor. */
export async function getCollegeContentAuthoringOptions(ctx:RequestContext,kind:"YOUTUBE"|"LIVE_CLASS"|"RESOURCE",filters:CollegeExistingContentFilters={}){
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
 .orderBy(asc(courses.name),asc(courseLessons.name));
 const deliveries=await db.select({deliveryId:courseSectionDeliveries.id,offeringId:courseOfferings.id,
  sectionName:sections.name,sectionCode:sections.code}).from(courseSectionDeliveries)
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
  .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),eq(sections.cohortId,courseOfferings.cohortId),eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
  .where(and(eq(sections.status,"ACTIVE"),eq(courseOfferings.status,"ACTIVE"),
   eq(courses.status,"ACTIVE"),isNull(courseSectionDeliveries.endedAt)))
  .orderBy(asc(sections.name)).limit(2000);
 const page=filters.page??1;
 if(!Number.isSafeInteger(page)||page<1||page>10000)throw new Error("INVALID_EXISTING_CONTENT_PAGE");
 const search=(filters.search??"").trim();
 if(search.length>100)throw new Error("INVALID_EXISTING_CONTENT_FILTER");
 const section=filters.sectionId?deliveries.find(row=>row.deliveryId===filters.sectionId):null;
 if(filters.sectionId&&!section)throw new Error("INVALID_EXISTING_CONTENT_SECTION");
 const where=[
  eq(lessonContents.contentType,kind),ne(lessonContents.status,"ARCHIVED"),
  ne(courseLearningPaths.status,"ARCHIVED"),eq(courseOfferings.status,"ACTIVE"),
  eq(courses.status,"ACTIVE"),
 ];
 if(filters.courseId)where.push(eq(courseOfferings.id,filters.courseId));
 if(filters.lessonId)where.push(eq(lessonContents.lessonId,filters.lessonId));
 if(section){
  where.push(eq(courseOfferings.id,section.offeringId));
  where.push(or(isNull(lessonContents.deliveryId),
   eq(lessonContents.deliveryId,section.deliveryId))!);
 }
 if(search){
  const pattern="%"+search.replace(/[\\%_]/g,(character)=>"\\"+character)+"%";
  where.push(or(ilike(lessonContents.title,pattern),ilike(courseLessons.name,pattern),
   ilike(courses.code,pattern))!);
 }
 const pageSize=50;
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
 .where(and(...where))
 .orderBy(asc(courseLessons.name),asc(lessonContents.sequence),asc(lessonContents.title),asc(lessonContents.id))
 .limit(pageSize+1).offset((page-1)*pageSize);
 const positions=lessons.length?await db.select({lessonId:lessonContents.lessonId,highest:max(lessonContents.sequence)})
  .from(lessonContents).where(inArray(lessonContents.lessonId,lessons.map(row=>row.id)))
  .groupBy(lessonContents.lessonId):[];
 const nextByLesson=new Map(positions.map(row=>[row.lessonId,(row.highest??-1)+1]));
 return {deliveries,lessons:lessons.map(row=>({...row,nextSequence:nextByLesson.get(row.id)??0})),existingTruncated:existing.length>pageSize,existingPage:page,
 existingFilters:{courseId:filters.courseId??"",lessonId:filters.lessonId??"",
  sectionId:filters.sectionId??"",search},
 existing:existing.slice(0,pageSize).map(row=>({...row,
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
