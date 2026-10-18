import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseQuizzes} from "@/db/schema";
import {type RequestContext,hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {requireDeliveryContentMutation} from "./learning-access";
import {loadCourseSectionDeliveryScope} from "./scope";
import {CoursesServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {facultyQuizResultsCommandSchema,facultyQuizResultsTransition} from "./faculty-quiz-results-command-model";
import {assertPersistedFacultyTeachingMutation} from "./faculty-persisted-teaching-guard";
import {z} from "zod";
export async function commandFacultyQuizResults(context:RequestContext,rawQuizId:unknown,raw:unknown){
 const quizId=z.string().uuid().parse(rawQuizId),input=facultyQuizResultsCommandSchema.parse(raw);
 const member=context.membership;
 if(!member||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY"))
   throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const delivery=await loadCourseSectionDeliveryScope(input.deliveryId);
 if(delivery.collegeId!==member.collegeId||
    !can(context,"courses.read",{collegeId:delivery.collegeId,organizationId:delivery.organizationId}))
   throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 if(await requireDeliveryContentMutation(context,input.deliveryId)!=="FACULTY")
   throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 return getDb().transaction(async tx=>{
  const [quiz]=await tx.select().from(courseQuizzes)
    .where(and(eq(courseQuizzes.id,quizId),eq(courseQuizzes.deliveryId,input.deliveryId)))
    .for("update").limit(1);
  if(!quiz)throw new CoursesServiceError("QUIZ_NOT_FOUND");
  await assertPersistedFacultyTeachingMutation(tx,context,input.deliveryId,delivery);
  if(quiz.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime())
    throw new CoursesServiceError("QUIZ_RESULTS_STALE_VERSION");
  if(!facultyQuizResultsTransition(quiz.status,quiz.resultsPublished,input.action,quiz.dueAt))
    throw new CoursesServiceError("INVALID_QUIZ_TRANSITION");
  const [updated]=await tx.update(courseQuizzes).set({
   resultsPublished:input.action==="PUBLISH",
   status:quiz.status==="PUBLISHED"?"CLOSED":quiz.status,
   updatedAt:new Date(Math.max(Date.now(),quiz.updatedAt.getTime()+1)),
  }).where(and(eq(courseQuizzes.id,quiz.id),eq(courseQuizzes.deliveryId,input.deliveryId),
    eq(courseQuizzes.status,quiz.status),
    sql`date_trunc('milliseconds', ${courseQuizzes.updatedAt}) =
      ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`,
   )).returning();
  if(!updated)throw new CoursesServiceError("QUIZ_RESULTS_STALE_VERSION");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.COURSES_QUIZ_RESULTS_CHANGED,
   collegeId:delivery.collegeId,organizationId:delivery.organizationId,
   subjectType:"course_quiz",subjectId:quiz.id,subjectLabel:quiz.title,
   summary:input.action==="PUBLISH"?"Faculty quiz results published":"Faculty quiz results hidden",
   metadata:{deliveryId:input.deliveryId,action:input.action,resultsPublished:updated.resultsPublished},
   groupKey:"course-delivery:"+input.deliveryId+":quiz-results",
  });
  return updated;
 });
}
