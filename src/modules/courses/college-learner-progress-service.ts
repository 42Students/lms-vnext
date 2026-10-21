import "server-only";

import {and,asc,desc,eq,inArray,isNull,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {
 academicPeriods,assignmentSubmissions,collegeMemberships,courseAssignments,
 courseLearningPaths,courseLessons,courseOfferings,courseQuizzes,
 courseSectionDeliveries,courses,departments,learnerContentProgress,
 learnerProfiles,learnerProgramEnrollments,lessonContents,membershipRoles,
 quizAttempts,sectionEnrollments,sections,users,
} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

/** Legacy classId/courseId integer pairs cannot be confused with scoped UUID
 * Section deliveries. Resolve imported IDs by the authorized import map, not
 * by casting or letting the caller select a different college. */
const selectionSchema=z.object({
 offeringId:z.string().uuid().optional(),
 deliveryId:z.string().uuid().optional(),
}).strict();

function collegeForReport(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN")||
  context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{
  collegeId:member.collegeId,organizationId:member.organizationId,
 });
 return member.collegeId;
}

/** Class/course choices include historical deliveries with explicit past markers.
 * Sources: legacy class+course -> Section + CourseOffering + delivery; progress
 * counts only published content visible to the selected audience. No migrated
 * numeric course IDs are assumed in a tenant without verified import mapping.
 */
export async function listCollegeLearnerProgressChoices(context:RequestContext){
 const collegeId=collegeForReport(context);
 return getDb().select({
  offeringId:courseOfferings.id,deliveryId:courseSectionDeliveries.id,
  sectionId:sections.id,courseCode:courses.code,courseName:courses.name,
  sectionName:sections.name,sectionCode:sections.code,
  periodName:academicPeriods.name,periodStartDate:academicPeriods.startDate,
  endedAt:courseSectionDeliveries.endedAt,
  offeringStatus:courseOfferings.status,sectionStatus:sections.status,
  legacyClassId:sections.legacyClassId,
  legacyOfferingId:courseOfferings.legacySemesterCourseId,
 }).from(courseSectionDeliveries)
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),
    eq(departments.collegeId,collegeId)))
  .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),
    eq(sections.cohortId,courseOfferings.cohortId),
    eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
  .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),
    eq(academicPeriods.collegeId,collegeId)))
  .where(and(
    // An imported, deleted section is historical, not a cross-college scope.
    eq(academicPeriods.collegeId,collegeId)))
  .orderBy(sql`case when ${courseOfferings.status} = 'ACTIVE' and
    ${sections.status} = 'ACTIVE' and ${courseSectionDeliveries.endedAt} is null
    then 0 else 1 end`,desc(academicPeriods.startDate),
    asc(sections.name),asc(courses.code))
  .limit(2001);
}

export async function getCollegeLearnerProgressReport(
 context:RequestContext,raw:unknown,
){
 const parsed=selectionSchema.safeParse(raw);
 const allChoices=await listCollegeLearnerProgressChoices(context);
 const choicesTruncated=allChoices.length>2000;
 const choices=allChoices.slice(0,2000);
 if(!parsed.success)return {choices,choicesTruncated,report:null,
  selectionError:"Invalid class/course selection. Choose a current pair."};
 const {offeringId,deliveryId}=parsed.data;
 if(!offeringId||!deliveryId)return {choices,choicesTruncated,report:null};
 const chosen=choices.find(item=>item.offeringId===offeringId&&item.deliveryId===deliveryId);
 if(!chosen)return {choices,choicesTruncated,report:null,
  selectionError:"The selected class and course do not match. Choose a current pair."};
 const db=getDb();
 const collegeId=collegeForReport(context);
 const historical=chosen.endedAt!==null||chosen.offeringStatus!=="ACTIVE"||
  chosen.sectionStatus!=="ACTIVE";

 // Include learners with zero activity: start from active Section enrollments.
 const learners=await db.select({
  membershipId:collegeMemberships.id,
  name:users.displayName,
  rollNumber:learnerProfiles.rollNumber,
 }).from(sectionEnrollments)
  .innerJoin(learnerProgramEnrollments,
    eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
  .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
  .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(sectionEnrollments.sectionId,chosen.sectionId),
    ...(historical?[]:[
     eq(sectionEnrollments.status,"ACTIVE"),
     eq(learnerProgramEnrollments.status,"ACTIVE"),
    ]),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .orderBy(asc(users.displayName),asc(collegeMemberships.id))
  .limit(2001);
 const visible=learners.slice(0,2000);
 const learnerListLimited=learners.length>2000;
 const [videoRows,assignmentRows,quizRows]=await Promise.all([
  db.select({id:lessonContents.id}).from(lessonContents)
   .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
   .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
   .where(and(eq(courseLearningPaths.offeringId,offeringId),
    eq(courseLearningPaths.status,"PUBLISHED"),
    eq(courseLessons.status,"ACTIVE"),
    eq(courseLessons.visibleToStudents,true),
    eq(lessonContents.status,"PUBLISHED"),
    eq(lessonContents.visibleToStudents,true),
    inArray(lessonContents.contentType,["VIDEO","YOUTUBE"]),
    or(isNull(lessonContents.deliveryId),eq(lessonContents.deliveryId,deliveryId)))),
  db.select({id:courseAssignments.id}).from(courseAssignments)
   .innerJoin(courseLessons,eq(courseLessons.id,courseAssignments.lessonId))
   .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
   .where(and(eq(courseLearningPaths.offeringId,offeringId),
    eq(courseLearningPaths.status,"PUBLISHED"),
    eq(courseLessons.status,"ACTIVE"),
    eq(courseLessons.visibleToStudents,true),eq(courseAssignments.status,"PUBLISHED"),
    or(isNull(courseAssignments.deliveryId),eq(courseAssignments.deliveryId,deliveryId)))),
  db.select({id:courseQuizzes.id}).from(courseQuizzes)
   .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
   .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
   .where(and(eq(courseLearningPaths.offeringId,offeringId),
    eq(courseLearningPaths.status,"PUBLISHED"),
    eq(courseLessons.status,"ACTIVE"),
    eq(courseLessons.visibleToStudents,true),
    eq(courseQuizzes.status,"PUBLISHED"),
    or(isNull(courseQuizzes.deliveryId),eq(courseQuizzes.deliveryId,deliveryId)))),
 ]);
 const members=visible.map(item=>item.membershipId);
 const videoIds=videoRows.map(item=>item.id),assignmentIds=assignmentRows.map(item=>item.id),
  quizIds=quizRows.map(item=>item.id);
 const [completions,submissions,attempts]=await Promise.all([
  members.length&&videoIds.length?db.select({
   membershipId:learnerContentProgress.membershipId,itemId:learnerContentProgress.lessonContentId,
   attempt:learnerContentProgress.attempt,completedAt:learnerContentProgress.completedAt,
  }).from(learnerContentProgress).where(and(
   inArray(learnerContentProgress.membershipId,members),
   inArray(learnerContentProgress.lessonContentId,videoIds))):[],
  members.length&&assignmentIds.length?db.select({
   membershipId:assignmentSubmissions.membershipId,itemId:assignmentSubmissions.assignmentId,
  }).from(assignmentSubmissions).where(and(
   inArray(assignmentSubmissions.membershipId,members),
   inArray(assignmentSubmissions.assignmentId,assignmentIds),
   eq(assignmentSubmissions.deliveryId,deliveryId))):[],
  members.length&&quizIds.length?db.select({
   membershipId:quizAttempts.membershipId,itemId:quizAttempts.quizId,
  }).from(quizAttempts).where(and(
   inArray(quizAttempts.membershipId,members),
   inArray(quizAttempts.quizId,quizIds),
   eq(quizAttempts.deliveryId,deliveryId))):[],
 ]);
 const byMember=(entries:readonly {membershipId:string;itemId:string}[])=>{
  const out=new Map<string,Set<string>>();
  for(const item of entries){
   const ids=out.get(item.membershipId)??new Set<string>();
   ids.add(item.itemId);out.set(item.membershipId,ids);
  }
  return out;
 };
 const latestVideo=new Map<string,(typeof completions)[number]>();
 for(const item of completions){
  const key=item.membershipId+":"+item.itemId;
  const prior=latestVideo.get(key);
  if(!prior||item.attempt>prior.attempt)latestVideo.set(key,item);
 }
 // The current attempt may be incomplete even if an older attempt completed.
 const videos=byMember([...latestVideo.values()].filter(item=>item.completedAt!==null));
 const assignments=byMember(submissions),quizzes=byMember(attempts);
 const itemsMeasured=videoIds.length+assignmentIds.length+quizIds.length;
 const rows=visible.map(member=>{
  const videoDone=Math.min(videoIds.length,videos.get(member.membershipId)?.size??0);
  const assignmentDone=Math.min(assignmentIds.length,assignments.get(member.membershipId)?.size??0);
  const quizDone=Math.min(quizIds.length,quizzes.get(member.membershipId)?.size??0);
  const completed=videoDone+assignmentDone+quizDone;
  return {...member,videoDone,assignmentDone,quizDone,completed,
   progress:itemsMeasured?Math.min(100,Math.max(0,Math.round(100*completed/itemsMeasured))):0};
 }).sort((a,b)=>a.progress-b.progress||String(a.name??"").localeCompare(String(b.name??"")));
 return {choices,choicesTruncated,report:{
  chosen,rows:itemsMeasured?rows:[],totalVideos:videoIds.length,totalAssignments:assignmentIds.length,
  totalQuizzes:quizIds.length,itemsMeasured,students:rows.length,
  truncated:learnerListLimited,
  completenessWarning:learnerListLimited
   ?"Only the first 2,000 scoped learners are represented in the table and derived metrics. Export or narrow the section before relying on totals.":null,
  denominatorNote:"Only currently published and visible videos, assignments and quizzes count; hidden, draft and audience-ineligible material is excluded.",
  historical,legacyIdMapping:"Numeric course/class bookmarks require a verified tenant-scoped import map; UUID delivery and offering identifiers are authoritative.",
  choicesTruncated,
  enrolledStudents:visible.length,
  noMeasurableWork:itemsMeasured===0,
  emptyReason:itemsMeasured===0?"No measurable items for the selected class and course.":null,
  notStarted:itemsMeasured?rows.filter(row=>row.completed===0).length:0,
  averageCompletion:rows.length&&itemsMeasured?
   Math.min(100,Math.round(100*rows.reduce((sum,row)=>sum+row.completed,0)/(rows.length*itemsMeasured))):null,
 }};
}
