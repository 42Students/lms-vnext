import "server-only";
import {and,eq,inArray,isNull,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseLearningPaths,courseLessons,lessonContents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {CoursesServiceError} from "./errors";
import {loadCourseSectionDeliveryScope} from "./scope";
import {requireLearningReadAccess} from "./learning-access";

/** LEARNER-course-detail-R04: one scoped material lookup only.
 * Never rehydrate lessons, quizzes, assessments or learner progress to
 * resolve a private file. Signed redirects are generated only after auth. */
export async function getLearnerCourseFileReference(
 context:RequestContext,deliveryRaw:unknown,contentRaw:unknown,
){
 const uuid=z.string().uuid();
 const deliveryId=uuid.parse(deliveryRaw),contentId=uuid.parse(contentRaw);
 const delivery=await loadCourseSectionDeliveryScope(deliveryId,true);
 const access=await requireLearningReadAccess(context,delivery.offeringId,deliveryId,{
  includeHistorical:true,
 });
 if(access!=="LEARNER")throw new CoursesServiceError("LEARNER_PROGRESS_ACCESS_DENIED");
 const [file]=await getDb().select({
  storageKey:lessonContents.storageKey,
 }).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .where(and(
  eq(lessonContents.id,contentId),
  eq(courseLearningPaths.offeringId,delivery.offeringId),
  inArray(courseLearningPaths.status,delivery.endedAt?["PUBLISHED","ARCHIVED"]:["PUBLISHED"]),
  eq(courseLessons.status,"ACTIVE"),
  eq(courseLessons.visibleToStudents,true),
  eq(lessonContents.status,"PUBLISHED"),
  eq(lessonContents.visibleToStudents,true),
  or(isNull(lessonContents.deliveryId),eq(lessonContents.deliveryId,deliveryId)),
 )).limit(1);
 return file?.storageKey??null;
}
