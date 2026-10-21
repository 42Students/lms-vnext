import "server-only";
import {and,eq,inArray,isNull,or,sql,lte} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseLearningPaths,courseLessons,lessonContents} from "@/db/schema";
import {lessonContentMaterials} from "@/db/schema/lesson-content-materials";
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

 const files=await getDb().select({
  key:lessonContentMaterials.storageKey,
  status:lessonContentMaterials.uploadStatus,
  scan:lessonContentMaterials.scanStatus,
  generation:lessonContentMaterials.objectGeneration,
  scanAttestedAt:lessonContentMaterials.scanAttestedAt,
  verifiedSize:lessonContentMaterials.verifiedSizeBytes,
 }).from(lessonContentMaterials)
 .innerJoin(lessonContents,eq(lessonContents.id,lessonContentMaterials.lessonContentId))
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .where(and(
  eq(lessonContents.id,contentId),
  eq(lessonContentMaterials.lessonContentId,contentId),
  eq(lessonContentMaterials.kind,"FILE"),
  eq(lessonContentMaterials.uploadStatus,"READY"),
  eq(lessonContentMaterials.scanStatus,"CLEAN"),
  eq(lessonContents.contentType,"RESOURCE"),
  eq(courseLearningPaths.offeringId,delivery.offeringId),
  inArray(courseLearningPaths.status,delivery.endedAt?["PUBLISHED","ARCHIVED"]:["PUBLISHED"]),
  eq(courseLessons.status,"ACTIVE"),
  eq(courseLessons.visibleToStudents,true),
  eq(lessonContents.status,"PUBLISHED"),
  eq(lessonContents.visibleToStudents,true),
  or(isNull(lessonContents.startsAt),lte(lessonContents.startsAt,sql`now()`)),
  or(isNull(lessonContents.deliveryId),eq(lessonContents.deliveryId,deliveryId)),
 )).limit(2);
 // An old storageKey on the lesson content is not proof of a scanned file.
 // Unqualified links without a material ID can only resolve ONE safe file.
 if(files.length!==1)return null;
 const file=files[0]!;
 if(file.status!=="READY"||file.scan!=="CLEAN"||!file.generation||
    !file.scanAttestedAt||!file.verifiedSize||file.verifiedSize<1)
  return null;
 return validCourseResourceStorageKey(file.key,delivery.collegeId)?file.key:null;
}

/** Private normalized key is tenant-bound. Never sign historical unverified
 * `org-…/college-…` paths or arbitrary keys supplied by a browser. */
export function validCourseResourceStorageKey(key:string|null,collegeId:string):key is string {
 if(!key||key.length>512)return false;
 const parts=key.split("/");
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 return parts.length===5&&parts[0]==="private"&&parts[1]===collegeId&&
  uuid.test(parts[2]??"")&&parts[3]==="course-resource"&&
  uuid.test(parts[4]??"");
}
