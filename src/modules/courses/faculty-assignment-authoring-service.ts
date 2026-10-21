import "server-only";

import {randomUUID} from "node:crypto";
import {z} from "zod";
import {normalizeAssignmentMethods} from "./assignment-submission-methods";
import {attestFacultyAssignmentResources, replaceFacultyAssignmentResources,facultyResourcesChanged} from "./faculty-assignment-resource-service";
import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {assignmentSubmissions,courseAssignments,courseAssignmentResources,courseSectionDeliveries,
 collegeMemberships,membershipRoles,courseTeachingAssignments,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {loadCourseLessonScope,loadCourseSectionDeliveryScope} from "./scope";
import {requireDeliveryContentMutation} from "./learning-access";
import {CoursesServiceError,postgresConstraintName} from "./errors";
import {assignmentFieldsChanged,facultyAssignmentCommandSchema,facultyAssignmentParamsSchema,
 facultyAssignmentVersionMatches,facultyAssignmentEditLockedBySubmissions,facultyAssignmentMethodsChanged} from "./faculty-assignment-authoring-model";

/** Own-Section, confirmed text-only commands. Uses row locks + millisecond tokens,
 * which match JS Date precision even when PostgreSQL stores microseconds. */
export async function commandFacultyAssignment(
  context:RequestContext,rawParams:unknown,rawInput:unknown,
){
  const {deliveryId}=facultyAssignmentParamsSchema.parse(rawParams);
  const input=facultyAssignmentCommandSchema.parse(rawInput);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY"))
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const delivery=await loadCourseSectionDeliveryScope(deliveryId);
  if(delivery.collegeId!==membership.collegeId||
     !can(context,"courses.read",{collegeId:delivery.collegeId,organizationId:delivery.organizationId}))
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const actor=await requireDeliveryContentMutation(context,deliveryId);
  if(actor!=="FACULTY")throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  if(input.action==="CREATE"){
    const lesson=await loadCourseLessonScope(input.lessonId);
    if(lesson.offeringId!==delivery.offeringId)
      throw new CoursesServiceError("ASSIGNMENT_DELIVERY_MISMATCH");
  }
  const normalizedResources=("resources" in input&&input.resources!==undefined)
    ?await attestFacultyAssignmentResources(context,delivery.collegeId,input.resources,
      input.action==="EDIT"?input.assignmentId:undefined):undefined;
  try{
    return await getDb().transaction(async tx=>{
      const [liveDelivery]=await tx.select({id:courseSectionDeliveries.id,endedAt:courseSectionDeliveries.endedAt})
        .from(courseSectionDeliveries)
        .where(eq(courseSectionDeliveries.id,deliveryId)).for("update").limit(1);
      if(!liveDelivery||liveDelivery.endedAt)
        throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
      // Recheck persisted actor and teaching rights *inside* the mutation transaction.
      // A stale authenticated context cannot bypass role removal or suspension.
      const [liveFaculty]=await tx.select({id:courseTeachingAssignments.id})
        .from(courseTeachingAssignments)
        .innerJoin(collegeMemberships,eq(collegeMemberships.id,courseTeachingAssignments.membershipId))
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"FACULTY")))
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .where(and(eq(courseTeachingAssignments.deliveryId,deliveryId),
          eq(courseTeachingAssignments.membershipId,membership.id),
          isNull(courseTeachingAssignments.endedAt),
          eq(collegeMemberships.userId,context.user.id),
          eq(collegeMemberships.collegeId,delivery.collegeId),
          eq(collegeMemberships.status,"ACTIVE"),
          eq(users.platformStatus,"ACTIVE")))
        .for("share").limit(1);
      if(!liveFaculty)throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
      let result:typeof courseAssignments.$inferSelect;
      let changedFields:string[]=[];
      let eventType:string;
      if(input.action==="CREATE"){
        const [created]=await tx.insert(courseAssignments).values({
          lessonId:input.lessonId,deliveryId,
          title:input.title,description:input.description,
          dueAt:input.dueAt?new Date(input.dueAt):null,
          maxPoints:input.maxPoints,sequence:input.sequence,
          ...(input.allowedMethods?{allowedSubmissionMethods:input.allowedMethods}:{}),
          status:"DRAFT",createdByUserId:context.user.id,
        }).returning();
        if(!created)throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
        result=created;changedFields=["created"];eventType=ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_CREATED;
      }else{
        const [current]=await tx.select().from(courseAssignments)
          .where(and(eq(courseAssignments.id,input.assignmentId),
            eq(courseAssignments.deliveryId,deliveryId)))
          .for("update").limit(1);
        if(!current)throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
        if(!facultyAssignmentVersionMatches(current.updatedAt,input.expectedUpdatedAt))
          throw new CoursesServiceError("FACULTY_ASSIGNMENT_STALE_VERSION");
        if(current.status==="ARCHIVED")
          throw new CoursesServiceError("INVALID_ASSIGNMENT_TRANSITION");
        const storedResources=input.action==="EDIT"&&normalizedResources!==undefined
          ?await tx.select().from(courseAssignmentResources).where(
            eq(courseAssignmentResources.assignmentId,current.id))
            .orderBy(courseAssignmentResources.position):[];
        const [submission]=await tx.select({id:assignmentSubmissions.id}).from(assignmentSubmissions)
          .where(eq(assignmentSubmissions.assignmentId,current.id)).limit(1);
        if(input.action==="EDIT"){
          if(!["DRAFT","PUBLISHED"].includes(current.status))
            throw new CoursesServiceError("INVALID_ASSIGNMENT_TRANSITION");
          changedFields=assignmentFieldsChanged(current,input);
          if(input.allowedMethods!==undefined&&facultyAssignmentMethodsChanged(current.allowedSubmissionMethods,input.allowedMethods))
            changedFields.push("allowedMethods");
          if(normalizedResources!==undefined&&
             facultyResourcesChanged(storedResources,normalizedResources))
            changedFields.push("resources");
          if(!changedFields.length)throw new CoursesServiceError("INVALID_ASSIGNMENT_TRANSITION");
          if(facultyAssignmentEditLockedBySubmissions(changedFields,Boolean(submission)))
            throw new CoursesServiceError("ASSIGNMENT_HAS_SUBMISSIONS");
          eventType=ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_UPDATED;
        }else if(input.action==="PUBLISH"){
          if(current.status!=="DRAFT"||!current.dueAt||current.dueAt.getTime()<=Date.now())
            throw new CoursesServiceError("INVALID_ASSIGNMENT_TRANSITION");
          changedFields=["status"];eventType=ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_PUBLISHED;
        }else{
          if(submission)throw new CoursesServiceError("ASSIGNMENT_HAS_SUBMISSIONS");
          changedFields=["status"];eventType=ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_ARCHIVED;
        }
        const now=new Date(Math.max(Date.now(),current.updatedAt.getTime()+1));
        const [updated]=await tx.update(courseAssignments).set(
          input.action==="EDIT"?{
            title:input.title,description:input.description,
            dueAt:input.dueAt?new Date(input.dueAt):null,
            maxPoints:input.maxPoints,updatedAt:now,
            ...(input.allowedMethods&&facultyAssignmentMethodsChanged(current.allowedSubmissionMethods,input.allowedMethods)
              ?{allowedSubmissionMethods:input.allowedMethods}:{}),
          }:{status:input.action==="PUBLISH"?"PUBLISHED":"ARCHIVED",updatedAt:now},
        ).where(and(eq(courseAssignments.id,current.id),
          eq(courseAssignments.deliveryId,deliveryId),
          eq(courseAssignments.status,current.status),
          sql`date_trunc('milliseconds', ${courseAssignments.updatedAt}) =
            ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`,
        )).returning();
        if(!updated)throw new CoursesServiceError("FACULTY_ASSIGNMENT_STALE_VERSION");
        result=updated;
      }
      if(normalizedResources!==undefined&&(input.action==="CREATE"||
        (input.action==="EDIT"&&changedFields.includes("resources")))){
        await replaceFacultyAssignmentResources(tx,result.id,context.user.id,
          normalizedResources);
      }
      await recordActivityEventInTransaction(tx,context,{
        eventType:eventType as typeof ACTIVITY_EVENT_TYPES[keyof typeof ACTIVITY_EVENT_TYPES],
        collegeId:delivery.collegeId,organizationId:delivery.organizationId,
        subjectType:"course_assignment",subjectId:result.id,
        subjectLabel:result.title,summary:"Faculty assignment "+input.action.toLowerCase(),
        metadata:{deliveryId,assignmentId:result.id,changedFields},
        groupKey:"course-delivery:"+deliveryId,
        dedupeKey:"faculty-assignment:"+result.id+":"+input.action+":"+randomUUID(),
      });
      return result;
    });
  }catch(error){
    const constraint=postgresConstraintName(error);
    if(constraint?.includes("course_assignments_delivery_active_name_uq"))
      throw new CoursesServiceError("ASSIGNMENT_NAME_CONFLICT");
    if(constraint?.includes("course_assignments_delivery_active_sequence_uq"))
      throw new CoursesServiceError("ASSIGNMENT_SEQUENCE_CONFLICT");
    throw error;
  }
}

/** Read a faculty-owned assignment's configured submission methods, never
 * exposing assignment metadata from another teaching Section. */
export async function getFacultyAssignmentMethods(
 context:RequestContext,rawParams:unknown,assignmentIdInput:unknown,
){
 const {deliveryId}=facultyAssignmentParamsSchema.parse(rawParams);
 const assignmentId=z.string().uuid().parse(assignmentIdInput);
 const actor=await requireDeliveryContentMutation(context,deliveryId);
 if(actor!=="FACULTY")throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const [row]=await getDb().select({
  id:courseAssignments.id,
  methods:courseAssignments.allowedSubmissionMethods,
 }).from(courseAssignments).where(and(
  eq(courseAssignments.id,assignmentId),
  eq(courseAssignments.deliveryId,deliveryId),
 )).limit(1);
 if(!row)throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
 return normalizeAssignmentMethods(row.methods);
}
