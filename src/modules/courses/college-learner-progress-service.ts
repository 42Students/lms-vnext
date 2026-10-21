import "server-only";

import {and,asc,eq,inArray,isNull,or} from "drizzle-orm";
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

/** Only tenant-scoped offerings with real active Section deliveries appear. */
export async function listCollegeLearnerProgressChoices(context:RequestContext){
 const collegeId=collegeForReport(context);
 return getDb().select({
  offeringId:courseOfferings.id,deliveryId:courseSectionDeliveries.id,
  sectionId:sections.id,courseCode:courses.code,courseName:courses.name,
  sectionName:sections.name,sectionCode:sections.code,
  periodName:academicPeriods.name,
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
  .where(and(isNull(courseSectionDeliveries.endedAt),
    eq(courseOfferings.status,"ACTIVE"),eq(sections.status,"ACTIVE")))
  .orderBy(asc(sections.name),asc(courses.code))
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
    eq(sectionEnrollments.status,"ACTIVE"),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .orderBy(asc(users.displayName),asc(collegeMemberships.id))
  .limit(2001);
 const visible=learners.slice(0,2000);
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
  truncated:learners.length>2000,
  choicesTruncated,
  enrolledStudents:visible.length,
  noMeasurableWork:itemsMeasured===0,
  emptyReason:itemsMeasured===0?"No measurable items for the selected class and course.":null,
  notStarted:itemsMeasured?rows.filter(row=>row.completed===0).length:0,
  averageCompletion:rows.length&&itemsMeasured?
   Math.min(100,Math.round(100*rows.reduce((sum,row)=>sum+row.completed,0)/(rows.length*itemsMeasured))):null,
 }};
}
