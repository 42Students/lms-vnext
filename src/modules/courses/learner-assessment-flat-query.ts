import "server-only";
import {and,eq,inArray,isNull,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {assignmentSubmissions,courseAssignments,courseLearningPaths,courseLessons,courseQuizzes,courseSectionDeliveries,quizAttempts} from "@/db/schema";

type Delivery={deliveryId:string;offeringId:string;courseId:string;courseName:string;courseCode:string};
/** One set of tenant-rostered, published assessment joins, no per-course workspace graph. */
export async function listOwnLearnerAssessmentRows(deliveries:readonly Delivery[],membershipId:string,nowMs:number){
 const ids=deliveries.map(row=>row.deliveryId);
 if(ids.length===0)return {assignments:[],quizzes:[]};
 const db=getDb();
 const byDelivery=new Map(deliveries.map(row=>[row.deliveryId,row]));
 const baseConditions=[inArray(courseSectionDeliveries.id,ids),
  eq(courseLearningPaths.status,"PUBLISHED"),eq(courseLessons.status,"ACTIVE"),
  eq(courseLessons.visibleToStudents,true)];
 const [assignmentRows,quizRows]=await Promise.all([
  db.select({
   deliveryId:courseSectionDeliveries.id,lessonId:courseLessons.id,lessonName:courseLessons.name,
   id:courseAssignments.id,title:courseAssignments.title,description:courseAssignments.description,
   dueAt:courseAssignments.dueAt,createdAt:courseAssignments.createdAt,maxPoints:courseAssignments.maxPoints,
   sequence:courseAssignments.sequence,submissionId:assignmentSubmissions.id,
   submissionType:assignmentSubmissions.submissionType,submissionText:assignmentSubmissions.textContent,
   submissionUrl:assignmentSubmissions.submissionUrl,submittedAt:assignmentSubmissions.submittedAt,
   gradePublished:assignmentSubmissions.gradePublished,pointsAwarded:assignmentSubmissions.pointsAwarded,
   feedback:assignmentSubmissions.feedback,gradingStatus:assignmentSubmissions.gradingStatus,
  }).from(courseSectionDeliveries)
   .innerJoin(courseLearningPaths,eq(courseLearningPaths.offeringId,courseSectionDeliveries.offeringId))
   .innerJoin(courseLessons,eq(courseLessons.learningPathId,courseLearningPaths.id))
   .innerJoin(courseAssignments,and(eq(courseAssignments.lessonId,courseLessons.id),
    or(isNull(courseAssignments.deliveryId),eq(courseAssignments.deliveryId,courseSectionDeliveries.id))))
   .leftJoin(assignmentSubmissions,and(eq(assignmentSubmissions.assignmentId,courseAssignments.id),
    eq(assignmentSubmissions.deliveryId,courseSectionDeliveries.id),
    eq(assignmentSubmissions.membershipId,membershipId)))
   .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED"))),
  db.select({
   deliveryId:courseSectionDeliveries.id,lessonId:courseLessons.id,lessonName:courseLessons.name,
   id:courseQuizzes.id,title:courseQuizzes.title,description:courseQuizzes.description,
   dueAt:courseQuizzes.dueAt,createdAt:courseQuizzes.createdAt,maxAttempts:courseQuizzes.maxAttempts,
   totalPoints:courseQuizzes.totalPoints,sequence:courseQuizzes.sequence,status:courseQuizzes.status,
   resultsPublished:courseQuizzes.resultsPublished,
   attemptsUsed:sql<number>`(select count(*)::integer from quiz_attempts qa
    where qa.quiz_id = ${courseQuizzes.id} and qa.membership_id = ${membershipId}::uuid
      and qa.delivery_id = ${courseSectionDeliveries.id})`,
   firstSubmittedAt:sql<Date|null>`(select min(qa.submitted_at) from quiz_attempts qa
    where qa.quiz_id = ${courseQuizzes.id} and qa.membership_id = ${membershipId}::uuid
      and qa.delivery_id = ${courseSectionDeliveries.id})`,
  }).from(courseSectionDeliveries)
   .innerJoin(courseLearningPaths,eq(courseLearningPaths.offeringId,courseSectionDeliveries.offeringId))
   .innerJoin(courseLessons,eq(courseLessons.learningPathId,courseLearningPaths.id))
   .innerJoin(courseQuizzes,and(eq(courseQuizzes.lessonId,courseLessons.id),
    or(isNull(courseQuizzes.deliveryId),eq(courseQuizzes.deliveryId,courseSectionDeliveries.id))))
   .where(and(...baseConditions,inArray(courseQuizzes.status,["PUBLISHED","CLOSED"]))),
 ]);
 const assignments=assignmentRows.map(row=>{
  const delivery=byDelivery.get(row.deliveryId)!;
  const completedAt=row.submittedAt;
  const gradePublished=row.gradePublished??false;
  return {
   id:row.id,title:row.title,description:row.description,dueAt:row.dueAt,createdAt:row.createdAt,
   maxPoints:row.maxPoints,sequence:row.sequence,deliveryId:row.deliveryId,courseId:delivery.courseId,
   courseName:delivery.courseName,courseCode:delivery.courseCode,lessonId:row.lessonId,lessonName:row.lessonName,
   submissionId:row.submissionId,submissionType:row.submissionType,submissionText:row.submissionText,
   submissionUrl:row.submissionUrl,submittedAt:row.submittedAt,gradePublished,
   pointsAwarded:gradePublished?row.pointsAwarded:null,feedback:gradePublished?row.feedback:null,
   gradingStatus:gradePublished&&row.gradingStatus==="GRADED"?"GRADED" as const:"NOT_GRADED" as const,
   progress:{status:completedAt?"COMPLETED" as const:"NOT_STARTED" as const,
    percentComplete:completedAt?100:0,completedAt},
  };
 });
 const quizzes=quizRows.map(row=>{
  const delivery=byDelivery.get(row.deliveryId)!;
  const attemptsUsed=Number(row.attemptsUsed??0);
  const completedAt=attemptsUsed>0&&row.firstSubmittedAt?new Date(row.firstSubmittedAt):null;
  const missed=!completedAt&&(row.status==="CLOSED"||(row.dueAt!==null&&row.dueAt.getTime()<nowMs));
  const status=completedAt?"COMPLETED" as const:missed?"MISSED" as const:"NOT_STARTED" as const;
  return {
   id:row.id,title:row.title,description:row.description,dueAt:row.dueAt,createdAt:row.createdAt,
   maxAttempts:row.maxAttempts,totalPoints:row.totalPoints,sequence:row.sequence,
   status:row.status==="CLOSED"?"CLOSED" as const:"PUBLISHED" as const,
   resultsPublished:row.resultsPublished,attemptsUsed,
   attemptsRemaining:row.status==="PUBLISHED"?Math.max(0,row.maxAttempts-attemptsUsed):0,
   deliveryId:row.deliveryId,courseId:delivery.courseId,courseName:delivery.courseName,
   courseCode:delivery.courseCode,lessonId:row.lessonId,lessonName:row.lessonName,
   progress:{status,percentComplete:completedAt?100:0,completedAt},
  };
 });
 return {assignments,quizzes};
}
