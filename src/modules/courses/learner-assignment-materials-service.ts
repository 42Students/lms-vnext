import "server-only";
import {and,asc,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {courseAssignmentMaterials,courseAssignments,courseAssignmentResources} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireDeliveryContentMutation,requireLearningReadAccess} from "./learning-access";
import {loadCourseAssignmentScope} from "./assignment-scope";
import {CoursesServiceError} from "./errors";
import {createPrivateReadGrant} from "@/modules/storage/private-object-storage";
import {facultyAssignmentMaterialLinkSchema,safeLearnerAssignmentMaterialLink} from "./learner-assignment-materials-model";

type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
const uuid=z.string().uuid();
export async function assignmentMaterialTableReady():Promise<boolean>{
 const result=await getDb().execute(sql`select to_regclass('public.course_assignment_materials') is not null as ready`);
 const records=Array.isArray(result)?result:((result as {rows?:unknown[]}).rows??[]);
 return (records[0] as {ready?:boolean}|undefined)?.ready===true;
}
export async function listOwnLearnerAssignmentMaterialLinks(context:RequestContext,
 assignmentIdInput:string,deliveryIdInput:string){
 const assignmentId=uuid.parse(assignmentIdInput),deliveryId=uuid.parse(deliveryIdInput);
 const assignment=await loadCourseAssignmentScope(assignmentId);
 if(assignment.deliveryId&&assignment.deliveryId!==deliveryId)
  throw new CoursesServiceError("ASSIGNMENT_DELIVERY_MISMATCH");
 const role=await requireLearningReadAccess(context,assignment.offeringId,deliveryId);
 if(role==="LEARNER"&&(assignment.status!=="PUBLISHED" ||
  assignment.learningPathStatus!=="PUBLISHED" || !assignment.lessonVisibleToStudents))
  throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
 if(!(await assignmentMaterialTableReady()))return {available:false,links:[]};
 const rows=await getDb().select({
   id:courseAssignmentMaterials.id,title:courseAssignmentMaterials.title,
   externalUrl:courseAssignmentMaterials.externalUrl,sequence:courseAssignmentMaterials.sequence,
 }).from(courseAssignmentMaterials)
  .where(and(eq(courseAssignmentMaterials.assignmentId,assignmentId),
    eq(courseAssignmentMaterials.kind,"LINK")))
  .orderBy(asc(courseAssignmentMaterials.sequence)).limit(20);
 return {available:true,links:rows.flatMap(row=>{
  const href=safeLearnerAssignmentMaterialLink(row.externalUrl);
  return href?[{id:row.id,title:row.title,href}]:[];
 })};
}

/** Faculty teaching this delivery may author up to 20 HTTPS links.
 * The parent assignment lock serializes concurrent sequence assignment. */
export async function commandFacultyAssignmentMaterialLink(context:RequestContext,
 assignmentIdInput:string,deliveryIdInput:string,raw:unknown){
 const input=z.discriminatedUnion("action",[
  z.object({action:z.literal("ADD"),link:facultyAssignmentMaterialLinkSchema}).strict(),
  z.object({action:z.literal("REMOVE"),materialId:uuid}).strict(),
 ]).parse(raw);
 const assignmentId=uuid.parse(assignmentIdInput),deliveryId=uuid.parse(deliveryIdInput);
 const role=await requireDeliveryContentMutation(context,deliveryId);
 if(role!=="FACULTY"&&role!=="ADMIN")throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
 if(!(await assignmentMaterialTableReady()))throw new CoursesServiceError("ASSIGNMENT_FILE_NOT_READY");
 const assignment=await loadCourseAssignmentScope(assignmentId);
 if(assignment.deliveryId!==deliveryId)throw new CoursesServiceError("ASSIGNMENT_DELIVERY_MISMATCH");
 return getDb().transaction(async tx=>{
  await lockPublishedOrDraftAssignment(tx,assignmentId,deliveryId);
  const rows=await tx.select().from(courseAssignmentMaterials)
   .where(eq(courseAssignmentMaterials.assignmentId,assignmentId))
   .orderBy(asc(courseAssignmentMaterials.sequence));
  if(input.action==="REMOVE"){
   const found=rows.find(row=>row.id===input.materialId);
   if(!found)throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
   await tx.delete(courseAssignmentMaterials).where(and(
    eq(courseAssignmentMaterials.id,found.id),eq(courseAssignmentMaterials.assignmentId,assignmentId)));
   await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_UPDATED,collegeId:assignment.collegeId,
    subjectType:"course_assignment",subjectId:assignment.id,
    summary:"Faculty removed assignment resource link",
    metadata:{assignmentId,materialId:found.id,action:"REMOVE_LINK",deliveryId},
   });
   return {id:found.id,removed:true};
  }
  if(rows.length>=20)throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
  if(rows.some(row=>row.externalUrl.toLowerCase()===input.link.externalUrl.toLowerCase()))
   throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
  const used=new Set(rows.map(row=>row.sequence));
  const sequence=Array.from({length:20},(_,i)=>i).find(i=>!used.has(i));
  if(sequence===undefined)throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
  const [created]=await tx.insert(courseAssignmentMaterials).values({
   assignmentId,kind:"LINK",title:input.link.title,externalUrl:input.link.externalUrl,
   sequence,createdByUserId:context.user.id,
  }).returning({id:courseAssignmentMaterials.id});
  if(!created)throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_UPDATED,collegeId:assignment.collegeId,
   subjectType:"course_assignment",subjectId:assignment.id,
   summary:"Faculty added assignment resource link",
   metadata:{assignmentId,materialId:created.id,action:"ADD_LINK",deliveryId},
  });
  return {id:created.id,removed:false};
 });
}
async function lockPublishedOrDraftAssignment(tx:Tx,assignmentId:string,deliveryId:string){
 const [row]=await tx.select({status:courseAssignments.status}).from(courseAssignments)
  .where(and(eq(courseAssignments.id,assignmentId),eq(courseAssignments.deliveryId,deliveryId)))
  .for("update").limit(1);
 if(!row||row.status==="ARCHIVED")throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
}

/** A historical assignment may contain both old instructor links and the
 * new ordered resource builder. This projection discloses no object keys.
 * Only enrolled learners in a published lesson can see the items. */
export async function listOwnLearnerAssignmentResources(
 context:RequestContext,assignmentIdRaw:string,deliveryIdRaw:string,
){
 const assignmentId=uuid.parse(assignmentIdRaw),deliveryId=uuid.parse(deliveryIdRaw);
 const assignment=await loadCourseAssignmentScope(assignmentId);
 if(assignment.deliveryId&&assignment.deliveryId!==deliveryId)
  throw new CoursesServiceError("ASSIGNMENT_DELIVERY_MISMATCH");
 const role=await requireLearningReadAccess(context,assignment.offeringId,deliveryId);
 if(role==="LEARNER"&&(assignment.status!=="PUBLISHED"||
    assignment.learningPathStatus!=="PUBLISHED"||!assignment.lessonVisibleToStudents))
  throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
 const result=await getDb().execute(sql`
   select to_regclass('public.course_assignment_resources') is not null as ready`);
 if(result.rows[0]?.ready!==true)return {available:false,items:[] as Array<{
   id:string;kind:string;title:string;body:string|null;href:string|null;position:number;
  }>};
 const rows=await getDb().select({
  id:courseAssignmentResources.id,kind:courseAssignmentResources.kind,
  title:courseAssignmentResources.title,body:courseAssignmentResources.body,
  externalUrl:courseAssignmentResources.externalUrl,
  position:courseAssignmentResources.position,
 }).from(courseAssignmentResources)
  .where(eq(courseAssignmentResources.assignmentId,assignmentId))
  .orderBy(asc(courseAssignmentResources.position)).limit(30);
 return {available:true,items:rows.map(row=>({
  id:row.id,kind:row.kind,title:row.title,
  body:row.kind==="INSTRUCTIONS"?row.body:null,
  href:row.kind==="LINK"?safeLearnerAssignmentMaterialLink(row.externalUrl):null,
  position:row.position,
 }))};
}

/** File URLs are signed on demand, after fresh enrollment checks. Object
 * owners are bound to the faculty account that originally uploaded them;
 * callers cannot supply or override an object key or owner membership. */
export async function createLearnerAssignmentResourceReadGrant(
 context:RequestContext,assignmentIdRaw:string,deliveryIdRaw:string,
 resourceIdRaw:string,
){
 const assignmentId=uuid.parse(assignmentIdRaw),deliveryId=uuid.parse(deliveryIdRaw);
 const resourceId=uuid.parse(resourceIdRaw);
 const assignment=await loadCourseAssignmentScope(assignmentId);
 if(assignment.deliveryId&&assignment.deliveryId!==deliveryId)
  throw new CoursesServiceError("ASSIGNMENT_DELIVERY_MISMATCH");
 const role=await requireLearningReadAccess(context,assignment.offeringId,deliveryId);
 if(role==="LEARNER"&&(assignment.status!=="PUBLISHED"||
   assignment.learningPathStatus!=="PUBLISHED"||!assignment.lessonVisibleToStudents))
  throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
 const [item]=await getDb().select({
  kind:courseAssignmentResources.kind,
  objectKey:courseAssignmentResources.privateObjectKey,
 }).from(courseAssignmentResources).where(and(
  eq(courseAssignmentResources.id,resourceId),
  eq(courseAssignmentResources.assignmentId,assignmentId),
 )).limit(1);
 if(!item||!item.objectKey||(item.kind!=="FILE"&&item.kind!=="PDF"))
  throw new CoursesServiceError("ASSIGNMENT_FILE_NOT_READY");
 const parts=item.objectKey.split("/");
 if(parts.length!==5||parts[0]!=="private"||
   parts[1]!==assignment.collegeId||parts[3]!=="course-resource"||
   !uuid.safeParse(parts[2]).success||!uuid.safeParse(parts[4]).success)
  throw new CoursesServiceError("ASSIGNMENT_FILE_NOT_READY");
 const grant=await createPrivateReadGrant({
  collegeId:assignment.collegeId,ownerMembershipId:parts[2],
  objectKey:item.objectKey,expiresInMs:5*60*1000,
 });
 return {readUrl:grant.readUrl,expiresAt:grant.expiresAt};
}
