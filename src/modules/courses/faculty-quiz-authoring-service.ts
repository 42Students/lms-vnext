import "server-only";
import {randomUUID} from "node:crypto";
import {and,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseQuizzes,courseSectionDeliveries,quizQuestions,quizOptions,quizAttempts} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {requireDeliveryContentMutation} from "./learning-access";
import {loadCourseLessonScope,loadCourseSectionDeliveryScope} from "./scope";
import {CoursesServiceError,postgresConstraintName} from "./errors";
import {facultyQuizCommandSchema,facultyQuizParamsSchema,sumQuizPoints,
 facultyQuizVersionMatches,facultyQuizMetadataUnchanged} from "./faculty-quiz-authoring-model";

/** Choice-question authoring with transaction, locked token, audit and no edits
 * after the quiz publishes or any registered attempt exists. */
export async function commandFacultyQuiz(context:RequestContext,rawParams:unknown,rawInput:unknown){
 const {deliveryId}=facultyQuizParamsSchema.parse(rawParams);
 const input=facultyQuizCommandSchema.parse(rawInput);
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY"))
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const delivery=await loadCourseSectionDeliveryScope(deliveryId);
 if(membership.collegeId!==delivery.collegeId||
  !can(context,"courses.read",{collegeId:delivery.collegeId,organizationId:delivery.organizationId}))
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const role=await requireDeliveryContentMutation(context,deliveryId);
 if(role!=="FACULTY")throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 if(input.action==="CREATE"){
  const lesson=await loadCourseLessonScope(input.lessonId);
  if(lesson.offeringId!==delivery.offeringId)
   throw new CoursesServiceError("QUIZ_DELIVERY_MISMATCH");
 }
 try{
  return await getDb().transaction(async tx=>{
   const [live]=await tx.select({id:courseSectionDeliveries.id,endedAt:courseSectionDeliveries.endedAt})
    .from(courseSectionDeliveries).where(eq(courseSectionDeliveries.id,deliveryId)).for("update").limit(1);
   if(!live||live.endedAt)throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
   let result:typeof courseQuizzes.$inferSelect;
   let eventType:typeof ACTIVITY_EVENT_TYPES[keyof typeof ACTIVITY_EVENT_TYPES];
   if(input.action==="CREATE"){
    const [created]=await tx.insert(courseQuizzes).values({
     lessonId:input.lessonId,deliveryId,title:input.title,description:input.description,
     dueAt:input.dueAt?new Date(input.dueAt):null,maxAttempts:input.maxAttempts,
     totalPoints:sumQuizPoints(input.questions),sequence:input.sequence,
     status:"DRAFT",createdByUserId:context.user.id,
    }).returning();
    if(!created)throw new CoursesServiceError("QUIZ_NOT_FOUND");
    result=created;eventType=ACTIVITY_EVENT_TYPES.COURSES_QUIZ_CREATED;
   }else{
    const [current]=await tx.select().from(courseQuizzes)
     .where(and(eq(courseQuizzes.id,input.quizId),eq(courseQuizzes.deliveryId,deliveryId)))
     .for("update").limit(1);
    if(!current)throw new CoursesServiceError("QUIZ_NOT_FOUND");
    if(!facultyQuizVersionMatches(current.updatedAt,input.expectedUpdatedAt))
     throw new CoursesServiceError("FACULTY_QUIZ_STALE_VERSION");
    // Legacy metadata-only edits are valid for published or closed quizzes:
    // never replace their question bank or answer snapshots after publication.
    // Archived quizzes remain immutable.
    if((input.action==="EDIT" &&
      (current.status==="ARCHIVED" ||
       (current.status!=="DRAFT" && input.questions!==undefined))) ||
     (input.action==="PUBLISH" && current.status!=="DRAFT") ||
     (input.action==="CLOSE" && current.status!=="PUBLISHED") ||
     (input.action==="ARCHIVE" && !["DRAFT","PUBLISHED","CLOSED"].includes(current.status)))
      throw new CoursesServiceError("INVALID_QUIZ_TRANSITION");
    const [attempt]=await tx.select({id:quizAttempts.id}).from(quizAttempts)
     .where(eq(quizAttempts.quizId,current.id)).limit(1);
    // Once a learner has attempted, the question bank, allowed attempt count
    // and history cannot be rewritten. Only title, text and deadline metadata
    // can change with a current optimistic version; closing still works.
    if(attempt && (input.action==="ARCHIVE" ||
       (input.action==="EDIT" &&
        (input.questions!==undefined || input.maxAttempts!==current.maxAttempts))))
      throw new CoursesServiceError("QUIZ_HAS_ATTEMPTS");
    if(input.action==="EDIT"){
     // Stale token is checked before no-op detection. Only metadata-only
     // writes can be compared without loading the immutable question bank.
     if(input.questions===undefined && facultyQuizMetadataUnchanged(current,input))
      throw new CoursesServiceError("FACULTY_QUIZ_NO_CHANGE");
     if(input.questions){
     const oldQuestions=await tx.select({id:quizQuestions.id}).from(quizQuestions)
      .where(eq(quizQuestions.quizId,current.id));
     const ids=oldQuestions.map(x=>x.id);
     if(ids.length){
      await tx.delete(quizOptions).where(inArray(quizOptions.questionId,ids));
      await tx.delete(quizQuestions).where(eq(quizQuestions.quizId,current.id));
     }
     }
     const now=new Date(Math.max(Date.now(),current.updatedAt.getTime()+1));
     const [edited]=await tx.update(courseQuizzes).set({
      title:input.title,description:input.description,
      dueAt:input.dueAt?new Date(input.dueAt):null,maxAttempts:input.maxAttempts,
      ...(input.questions?{totalPoints:sumQuizPoints(input.questions)}:{}),updatedAt:now,
     }).where(and(eq(courseQuizzes.id,current.id),eq(courseQuizzes.deliveryId,deliveryId),
      eq(courseQuizzes.status,current.status),
      sql`date_trunc('milliseconds', ${courseQuizzes.updatedAt}) =
        ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`,
     )).returning();
     if(!edited)throw new CoursesServiceError("FACULTY_QUIZ_STALE_VERSION");
     result=edited;eventType=ACTIVITY_EVENT_TYPES.COURSES_QUIZ_UPDATED;
    }else{
     if(input.action==="PUBLISH" && current.dueAt &&
      current.dueAt.getTime()<=Date.now())
       throw new CoursesServiceError("QUIZ_DEADLINE_PASSED");
     const isArchive=input.action==="ARCHIVE";
     const isClose=input.action==="CLOSE";
     const [transitioned]=await tx.update(courseQuizzes).set({
      status:isArchive?"ARCHIVED":isClose?"CLOSED":"PUBLISHED",
      updatedAt:new Date(Math.max(Date.now(),current.updatedAt.getTime()+1)),
     }).where(and(eq(courseQuizzes.id,current.id),eq(courseQuizzes.deliveryId,deliveryId),
      eq(courseQuizzes.status,current.status),
      sql`date_trunc('milliseconds', ${courseQuizzes.updatedAt}) =
        ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`,
     )).returning();
     if(!transitioned)throw new CoursesServiceError("FACULTY_QUIZ_STALE_VERSION");
     result=transitioned;
     eventType=isArchive?ACTIVITY_EVENT_TYPES.COURSES_QUIZ_ARCHIVED:
      isClose?ACTIVITY_EVENT_TYPES.COURSES_QUIZ_CLOSED:
      ACTIVITY_EVENT_TYPES.COURSES_QUIZ_PUBLISHED;
    }
   }
   if((input.action==="CREATE"||input.action==="EDIT")&&input.questions){
    for(const question of input.questions){
     const [q]=await tx.insert(quizQuestions).values({
      quizId:result.id,questionType:question.type,prompt:question.prompt,
      points:question.points,sequence:question.sequence,
     }).returning();
     await tx.insert(quizOptions).values(question.options.map(option=>({
      questionId:q.id,optionText:option.text,isCorrect:option.correct,sequence:option.sequence,
     })));
    }
   }
   await recordActivityEventInTransaction(tx,context,{
    eventType,collegeId:delivery.collegeId,organizationId:delivery.organizationId,
    subjectType:"course_quiz",subjectId:result.id,subjectLabel:result.title,
    summary:"Faculty quiz "+input.action.toLowerCase(),
    groupKey:"course-delivery:"+deliveryId,
    metadata:{deliveryId,quizId:result.id,action:input.action},
    dedupeKey:"faculty-quiz:"+result.id+":"+input.action+":"+randomUUID(),
   });
   return result;
  });
 }catch(error){
  const code=postgresConstraintName(error);
  if(code==="course_quizzes_delivery_active_name_uq")throw new CoursesServiceError("QUIZ_NAME_CONFLICT");
  if(code==="course_quizzes_delivery_active_sequence_uq")throw new CoursesServiceError("QUIZ_SEQUENCE_CONFLICT");
  throw error;
 }
}
