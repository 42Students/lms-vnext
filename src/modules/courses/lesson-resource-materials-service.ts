import "server-only";

import {and,asc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {lessonContents} from "@/db/schema";
import {lessonContentMaterials} from "@/db/schema/lesson-content-materials";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {requireDeliveryContentMutation,requireLearningReadAccess} from "./learning-access";
import {loadLessonContentScope} from "./scope";
import {CoursesServiceError} from "./errors";
import {resourceMaterialCommandSchema,resourceMaterialsWriteReady,safeLearnerResourceMaterialHref} from "./lesson-resource-materials-model";

function ensureReady(){
 if(!resourceMaterialsWriteReady())throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
}
async function authorizeMaterial(context:RequestContext,contentId:string,deliveryId:string|null,write:boolean){
 const content=await loadLessonContentScope(contentId);
 if(content.contentType!=="RESOURCE")throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
 if(content.deliveryId&&content.deliveryId!==deliveryId)
  throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
 if(write){
  if(content.deliveryId)await requireDeliveryContentMutation(context,content.deliveryId);
  else if(!can(context,"courses.manage",{collegeId:content.collegeId,organizationId:content.organizationId}))
   throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
 }else{
  const role=await requireLearningReadAccess(context,content.offeringId,deliveryId);
  if(role==="LEARNER"&&(content.status!=="PUBLISHED"||content.learningPathStatus!=="PUBLISHED"||!content.lessonVisibleToStudents||!content.visibleToStudents))
   throw new CoursesServiceError("LESSON_CONTENT_NOT_PUBLISHED");
 }
 return content;
}
export async function listLessonResourceMaterials(
 context:RequestContext,contentId:string,deliveryId:string|null,
){
 ensureReady();
 await authorizeMaterial(context,contentId,deliveryId,false);
 const rows=await getDb().select({
  id:lessonContentMaterials.id,title:lessonContentMaterials.title,
  notes:lessonContentMaterials.notes,kind:lessonContentMaterials.kind,
  externalUrl:lessonContentMaterials.externalUrl,
  originalName:lessonContentMaterials.originalName,
  mimeType:lessonContentMaterials.mimeType,
  sizeBytes:lessonContentMaterials.sizeBytes,
  sequence:lessonContentMaterials.sequence,
  uploadStatus:lessonContentMaterials.uploadStatus,
 }).from(lessonContentMaterials).where(eq(lessonContentMaterials.lessonContentId,contentId))
  .orderBy(asc(lessonContentMaterials.sequence)).limit(20);
 // FILE rows never disclose opaque object keys; a separate auth-scoped signed
 // download-grant endpoint will serve only verified/clean READY materials.
 // Historical imported LINK rows bypassed today's authoring validation: never
 // hand their unsafe raw href to a learner or staff client's navigation layer.
 return rows.map(row=>row.kind==="LINK"
  ? {...row,externalUrl:safeLearnerResourceMaterialHref(row.externalUrl)}
  : row);
}
export async function commandLessonResourceMaterial(
 context:RequestContext,contentId:string,deliveryId:string|null,rawInput:unknown,
){
 ensureReady();
 const input=resourceMaterialCommandSchema.parse(rawInput);
 const content=await authorizeMaterial(context,contentId,deliveryId,true);
 return getDb().transaction(async tx=>{
  const [locked]=await tx.select({id:lessonContents.id,status:lessonContents.status})
   .from(lessonContents).where(and(eq(lessonContents.id,contentId),eq(lessonContents.contentType,"RESOURCE")))
   .for("update").limit(1);
  if(!locked||locked.status==="ARCHIVED")throw new CoursesServiceError("LESSON_CONTENT_NOT_FOUND");
  async function recordAudit(id:string,action:string){
   await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.COURSES_LESSON_MATERIAL_UPDATED,
    collegeId:content.collegeId,organizationId:content.organizationId,
    subjectType:"lesson_content",subjectId:contentId,
    summary:"Resource material "+action.toLowerCase(),
    metadata:{materialId:id,kind:"LINK",deliveryId},
   });
  }
  const rows=await tx.select({id:lessonContentMaterials.id,kind:lessonContentMaterials.kind,
    externalUrl:lessonContentMaterials.externalUrl,sequence:lessonContentMaterials.sequence})
   .from(lessonContentMaterials).where(eq(lessonContentMaterials.lessonContentId,contentId))
   .orderBy(asc(lessonContentMaterials.sequence));
  if(input.action==="ADD_LINK"){
   if(rows.length>=20)throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
   if(rows.some(row=>row.externalUrl?.toLowerCase()===input.externalUrl.toLowerCase()))
    throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
   const [created]=await tx.insert(lessonContentMaterials).values({
    lessonContentId:contentId,kind:"LINK",title:input.title,notes:input.notes,
    externalUrl:input.externalUrl,sequence:rows.length?Math.max(...rows.map(x=>x.sequence))+1:0,
    createdByUserId:context.user.id,uploadStatus:"READY",
   }).returning({id:lessonContentMaterials.id});
   await recordAudit(created!.id,input.action);
   return {id:created!.id,action:input.action};
  }
  const old=rows.find(row=>row.id===input.materialId);
  if(!old||old.kind!=="LINK")throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
  if(input.action==="EDIT_LINK"){
   if(rows.some(row=>row.id!==old.id&&row.externalUrl?.toLowerCase()===input.externalUrl.toLowerCase()))
    throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
   await tx.update(lessonContentMaterials).set({
    title:input.title,notes:input.notes,externalUrl:input.externalUrl,updatedAt:new Date(),
   }).where(and(eq(lessonContentMaterials.id,old.id),eq(lessonContentMaterials.lessonContentId,contentId)));
  }else{
   await tx.delete(lessonContentMaterials).where(and(
    eq(lessonContentMaterials.id,old.id),eq(lessonContentMaterials.lessonContentId,contentId)));
  }
  await recordAudit(old.id,input.action);
  return {id:old.id,action:input.action};
 });
}
