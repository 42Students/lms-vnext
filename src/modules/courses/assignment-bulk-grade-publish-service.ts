import "server-only";

import {and,asc,count,eq,inArray,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {assignmentSubmissions} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {recordActivityEvent} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {loadCourseAssignmentScope} from "./assignment-scope";
import {loadCourseSectionDeliveryScope} from "./scope";
import {publishAssignmentGrade} from "./assignment-submission-service";
import {courseAssignmentIdSchema} from "./assignment-validation";
import {CoursesServiceError} from "./errors";

const MAX_BATCH=200;
const bulkPublishInput=z.strictObject({
  requestId:z.string().uuid(),
  deliveryId:z.string().uuid().nullable().optional(),
  submissionIds:z.array(z.string().uuid()).max(MAX_BATCH).optional(),
});

/**
 * Publish a bounded batch on the SERVER rather than looping in the browser.
 * Each grade uses the existing optimistic/version-checked publication transaction,
 * learner notification and per-submission audit. Call again to resume after
 * interruption; published rows are skipped by the persisted predicate.
 */
export async function publishAssignmentGradeBatch(
  context:RequestContext,rawAssignmentId:string,rawInput:unknown,
){
  const assignmentId=courseAssignmentIdSchema.parse(rawAssignmentId);
  const input=bulkPublishInput.parse(rawInput);
  const scope=await loadCourseAssignmentScope(assignmentId);
  requirePermission(context,"courses.manage",{
    collegeId:scope.collegeId,organizationId:scope.organizationId,
  });
  if(scope.status!=="PUBLISHED")throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
  if(input.deliveryId){
    const section=await loadCourseSectionDeliveryScope(input.deliveryId);
    if(section.offeringId!==scope.offeringId ||
      (scope.deliveryId&&scope.deliveryId!==input.deliveryId)){
      throw new CoursesServiceError("ASSIGNMENT_DELIVERY_MISMATCH");
    }
  }
  const conditions=and(
    eq(assignmentSubmissions.assignmentId,assignmentId),
    eq(assignmentSubmissions.gradingStatus,"GRADED"),
    eq(assignmentSubmissions.gradePublished,false),
    input.deliveryId?eq(assignmentSubmissions.deliveryId,input.deliveryId):undefined,
  );
  const db=getDb();
  const visibleScope=and(
   eq(assignmentSubmissions.assignmentId,assignmentId),
   input.deliveryId?eq(assignmentSubmissions.deliveryId,input.deliveryId):undefined,
   input.submissionIds?inArray(assignmentSubmissions.id,input.submissionIds):undefined,
  );
  // Classification is independent of actual publications; a previously
  // published grade and an ungraded submission are skips, not failures.
  const [classification]=await db.select({
   total:count(),
   skippedUngraded:sql<number>`count(*) filter (where ${assignmentSubmissions.gradingStatus}<>'GRADED')::int`,
   alreadyPublished:sql<number>`count(*) filter (where ${assignmentSubmissions.gradePublished}=true)::int`,
  }).from(assignmentSubmissions).where(visibleScope);
  const [initial]=await db.select({total:count()}).from(assignmentSubmissions).where(conditions);
  const rows=await db.select({
    id:assignmentSubmissions.id,version:assignmentSubmissions.version,
  }).from(assignmentSubmissions)
    .where(and(conditions,input.submissionIds?
      inArray(assignmentSubmissions.id,input.submissionIds):undefined))
    .orderBy(asc(assignmentSubmissions.id)).limit(MAX_BATCH);
  let published=0;
  const failedIds:string[]=[];
  const failedRows:{submissionId:string;reason:string}[]=[];
  for(const row of rows){
    try{
      await publishAssignmentGrade(context,row.id,{expectedVersion:row.version});
      published++;
    }catch{
      // Report safe, non-identifying failure reasons, never raw DB error text.
      failedIds.push(row.id);
      failedRows.push({submissionId:row.id,reason:"Concurrent grade change or temporary publication failure; retry with the latest version."});
    }
  }
  const [after]=await db.select({total:count()}).from(assignmentSubmissions).where(conditions);
  const remaining=after?.total??0;
  const receipt=await recordActivityEvent(context,{
    eventType:ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_GRADE_PUBLISHED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"course_assignment",subjectId:assignmentId,
    summary:"Assignment grade publication batch processed",
    metadata:{
      assignmentId,deliveryId:input.deliveryId??null,
      initiallyPending:initial?.total??0,processed:rows.length,
      published,failed:failedIds.length,remaining,
      skippedUngraded:classification?.skippedUngraded??0,
      alreadyPublished:classification?.alreadyPublished??0,
    },
    groupKey:"course-assignment:"+assignmentId+":grading",
    dedupeKey:"course-assignment:"+assignmentId+":bulk-grades:"+input.requestId,
  });
  return {
    published,failed:failedIds.length,failedIds,
    failureDetails:failedRows,remaining,
    skippedUngraded:classification?.skippedUngraded??0,
    alreadyPublished:classification?.alreadyPublished??0,
    processed:rows.length,batchLimit:MAX_BATCH,
    complete:remaining===0,receiptId:receipt.id,
  };
}
