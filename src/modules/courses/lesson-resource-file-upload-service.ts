import "server-only";

import {and,eq,ne} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {lessonContents} from "@/db/schema";
import {lessonContentMaterials,lessonMaterialFileInputError} from "@/db/schema/lesson-content-materials";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {
 createPrivateUploadGrant,readPrivateObjectAttestation,PrivateObjectStorageError,
} from "@/modules/storage/private-object-storage";
import {getPrivateR2Config} from "@/modules/storage/r2-config";
import {deleteObject} from "@/modules/storage/s3-client";
import {StorageFileError} from "@/modules/storage/file-errors";
import {requireDeliveryContentMutation} from "./learning-access";
import {loadLessonContentScope} from "./scope";
import {resourceMaterialsWriteReady} from "./lesson-resource-materials-model";
import {CoursesServiceError} from "./errors";

const uuid=z.string().uuid();
const fileInput=z.strictObject({
 deliveryId:uuid.nullable().optional(),
 originalName:z.string().trim().min(3).max(255),
 contentType:z.string().trim().min(1).max(128),
 sizeBytes:z.number().int().min(1).max(50*1024*1024),
 title:z.string().trim().min(1).max(255),
 notes:z.string().trim().max(2000).nullable().optional(),
});
const mimeForExtension:Record<string,readonly string[]>={
 pdf:["application/pdf"],doc:["application/msword"],
 docx:["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
 ppt:["application/vnd.ms-powerpoint"],
 pptx:["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
 xls:["application/vnd.ms-excel"],
 xlsx:["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
 txt:["text/plain"],csv:["text/csv","application/csv"],
 png:["image/png"],jpg:["image/jpeg"],jpeg:["image/jpeg"],
 webp:["image/webp"],
};
function fileNotReady(){
 if(!resourceMaterialsWriteReady())throw new StorageFileError("STORAGE_NOT_CONFIGURED");
}
function storageFailure(error:unknown):never{
 if(error instanceof StorageFileError)throw error;
 if(error instanceof PrivateObjectStorageError){
  if(error.code==="PRIVATE_STORAGE_NOT_CONFIGURED"||
     error.code==="PRIVATE_STORAGE_BUCKET_UNSAFE")
   throw new StorageFileError("STORAGE_NOT_CONFIGURED");
  if(error.code==="PRIVATE_STORAGE_OBJECT_NOT_ATTESTED")
   throw new StorageFileError("STORAGE_FILE_NOT_READY");
 }
 throw new StorageFileError("STORAGE_PROVIDER_UNAVAILABLE");
}
async function authorizeWriter(
 context:RequestContext,contentId:string,deliveryId:string|null,
){
 fileNotReady();
 const scope=await loadLessonContentScope(uuid.parse(contentId));
 if(scope.contentType!=="RESOURCE"||scope.status==="ARCHIVED")
  throw new CoursesServiceError("LESSON_CONTENT_NOT_FOUND");
 if(scope.deliveryId!==null&&scope.deliveryId!==deliveryId)
  throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
 if(scope.deliveryId)await requireDeliveryContentMutation(context,scope.deliveryId);
 else if(!can(context,"courses.manage",{
  collegeId:scope.collegeId,organizationId:scope.organizationId,
 }))throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||member.collegeId!==scope.collegeId||
    context.user.platformStatus!=="ACTIVE")
  throw new StorageFileError("STORAGE_UPLOADER_MEMBERSHIP_REQUIRED");
 return {scope,member};
}
function assertedResourceKey(key:string,collegeId:string){
 const parts=key.split("/");
 if(parts.length!==5||parts[0]!=="private"||parts[1]!==collegeId||
  parts[3]!=="course-resource"||!uuid.safeParse(parts[2]).success||
  !uuid.safeParse(parts[4]).success)
  throw new StorageFileError("STORAGE_NOT_FOUND");
 return parts[2]!;
}
const fileSelection={
 id:lessonContentMaterials.id,storageKey:lessonContentMaterials.storageKey,
 mimeType:lessonContentMaterials.mimeType,sizeBytes:lessonContentMaterials.sizeBytes,
 uploadTokenHash:lessonContentMaterials.uploadTokenHash,
 uploadStatus:lessonContentMaterials.uploadStatus,
};

export async function beginLessonResourceFileUpload(
 context:RequestContext,contentId:string,rawInput:unknown,
){
 const input=fileInput.parse(rawInput);
 const {scope,member}=await authorizeWriter(context,contentId,input.deliveryId??null);
 const validation=lessonMaterialFileInputError({
  name:input.originalName,size:input.sizeBytes,
 },0);
 if(validation)throw new StorageFileError(
  validation.includes("50 MB")?"STORAGE_FILE_TOO_LARGE":"STORAGE_TYPE_NOT_ALLOWED");
 const extension=input.originalName.split(".").at(-1)?.toLowerCase()??"";
 const mime=input.contentType.toLowerCase();
 if(!mimeForExtension[extension]?.includes(mime))
  throw new StorageFileError("STORAGE_EXTENSION_MISMATCH");
 let grant:Awaited<ReturnType<typeof createPrivateUploadGrant>>;
 try{
  grant=await createPrivateUploadGrant({
   collegeId:scope.collegeId,ownerMembershipId:member.id,
   namespace:"course-resource",contentType:mime,
   expectedSizeBytes:input.sizeBytes,originalName:input.originalName,
   maxSizeBytes:50*1024*1024,
  });
 }catch(error){return storageFailure(error);}
 const [created]=await getDb().transaction(async tx=>{
  const [locked]=await tx.select({id:lessonContents.id,status:lessonContents.status})
   .from(lessonContents).where(and(
    eq(lessonContents.id,contentId),eq(lessonContents.contentType,"RESOURCE"),
   )).for("update").limit(1);
  if(!locked||locked.status==="ARCHIVED")
   throw new CoursesServiceError("LESSON_CONTENT_NOT_FOUND");
  const existing=await tx.select({
   sequence:lessonContentMaterials.sequence,
   uploadStatus:lessonContentMaterials.uploadStatus,
  }).from(lessonContentMaterials)
   .where(eq(lessonContentMaterials.lessonContentId,contentId));
  if(existing.filter(row=>row.uploadStatus!=="DELETED").length>=20)
   throw new StorageFileError("STORAGE_FILE_LIMIT_REACHED");
  const next=existing.reduce((value,row)=>Math.max(value,row.sequence+1),0);
  if(next>2147483647)throw new StorageFileError("STORAGE_FILE_LIMIT_REACHED");
  return tx.insert(lessonContentMaterials).values({
   lessonContentId:contentId,kind:"FILE",title:input.title,
   notes:input.notes??null,storageKey:grant.objectKey,
   originalName:input.originalName,mimeType:mime,sizeBytes:input.sizeBytes,
   sequence:next,createdByUserId:context.user.id,
   uploadStatus:"UPLOADING",scanStatus:"PENDING",
   uploadTokenHash:grant.uploadTokenHash,uploadExpiresAt:grant.expiresAt,
  }).returning({id:lessonContentMaterials.id});
 });
 if(!created)throw new StorageFileError("STORAGE_PROVIDER_UNAVAILABLE");
 // Never send the opaque object key to the browser. The presigned PUT
 // must use exactly the generated headers; the scanner alone promotes READY.
 return {
  material:{id:created.id,title:input.title,originalName:input.originalName,
   sizeBytes:input.sizeBytes,uploadStatus:"UPLOADING" as const},
  grant:{uploadUrl:grant.uploadUrl,requiredHeaders:grant.requiredHeaders,
   method:grant.method,expiresAt:grant.expiresAt.toISOString()},
 };
}

export async function completeLessonResourceFileUpload(
 context:RequestContext,contentId:string,materialId:string,deliveryId:string|null,
){
 const {scope}=await authorizeWriter(context,contentId,deliveryId);
 const [row]=await getDb().select(fileSelection).from(lessonContentMaterials)
  .where(and(eq(lessonContentMaterials.id,uuid.parse(materialId)),
   eq(lessonContentMaterials.lessonContentId,contentId),
   eq(lessonContentMaterials.kind,"FILE"))).limit(1);
 if(!row||!row.storageKey||!row.uploadTokenHash)
  throw new StorageFileError("STORAGE_NOT_FOUND");
 const ownerId=assertedResourceKey(row.storageKey,scope.collegeId);
 if(row.uploadStatus==="READY")return {id:row.id,uploadStatus:"READY" as const};
 if(row.uploadStatus==="DELETED"||row.uploadStatus==="QUARANTINED"||row.uploadStatus==="FAILED")
  throw new StorageFileError("STORAGE_INVALID_STATE");
 let verified:Awaited<ReturnType<typeof readPrivateObjectAttestation>>;
 try{
  verified=await readPrivateObjectAttestation(row.storageKey,{
   collegeId:scope.collegeId,ownerMembershipId:ownerId,uploadTokenHash:row.uploadTokenHash,
  });
 }catch(error){
  if(error instanceof PrivateObjectStorageError&&error.code==="PRIVATE_STORAGE_OBJECT_NOT_ATTESTED"){
   await getDb().update(lessonContentMaterials).set({
    uploadStatus:"VERIFYING",updatedAt:new Date(),
   }).where(and(eq(lessonContentMaterials.id,row.id),
    eq(lessonContentMaterials.lessonContentId,contentId),
    eq(lessonContentMaterials.uploadStatus,"UPLOADING")));
   return {id:row.id,uploadStatus:"VERIFYING" as const};
  }
  return storageFailure(error);
 }
 if(verified.sizeBytes!==row.sizeBytes||verified.contentType!==row.mimeType){
  await getDb().update(lessonContentMaterials).set({
   uploadStatus:"QUARANTINED",failureCode:"MISMATCH",updatedAt:new Date(),
  }).where(and(eq(lessonContentMaterials.id,row.id),
   eq(lessonContentMaterials.lessonContentId,contentId),
   ne(lessonContentMaterials.uploadStatus,"DELETED")));
  throw new StorageFileError("STORAGE_UPLOAD_MISMATCH");
 }
 const [ready]=await getDb().update(lessonContentMaterials).set({
  uploadStatus:"READY",scanStatus:"CLEAN",
  scanAttestedBy:verified.scanner,scanAttestedAt:new Date(),
  objectGeneration:verified.generation,
  verifiedSizeBytes:verified.sizeBytes,verifiedContentType:verified.contentType,
  completedAt:new Date(),updatedAt:new Date(),
 }).where(and(eq(lessonContentMaterials.id,row.id),
  eq(lessonContentMaterials.lessonContentId,contentId),
  ne(lessonContentMaterials.uploadStatus,"DELETED"),
  ne(lessonContentMaterials.uploadStatus,"QUARANTINED"),
 )).returning({id:lessonContentMaterials.id});
 if(!ready)throw new StorageFileError("STORAGE_INVALID_STATE");
 return {id:ready.id,uploadStatus:"READY" as const};
}

const fileDetailsInput=z.strictObject({
 deliveryId:uuid.nullable().optional(),
 title:z.string().trim().min(1).max(255),
 notes:z.string().trim().max(2000).nullable().optional(),
});
/** Edit FILE metadata without overwriting the verified object, token or scan
 * attestation; the byte replacement workflow is separately grant-scoped. */
export async function editLessonResourceFileDetails(
 context:RequestContext,contentId:string,materialId:string,rawInput:unknown,
){
 const input=fileDetailsInput.parse(rawInput);
 await authorizeWriter(context,contentId,input.deliveryId??null);
 const [updated]=await getDb().update(lessonContentMaterials).set({
  title:input.title,notes:input.notes??null,updatedAt:new Date(),
 }).where(and(
  eq(lessonContentMaterials.id,uuid.parse(materialId)),
  eq(lessonContentMaterials.lessonContentId,contentId),
  eq(lessonContentMaterials.kind,"FILE"),
  ne(lessonContentMaterials.uploadStatus,"DELETED"),
  ne(lessonContentMaterials.uploadStatus,"QUARANTINED"),
 )).returning({
  id:lessonContentMaterials.id,title:lessonContentMaterials.title,
  notes:lessonContentMaterials.notes,
 });
 if(!updated)throw new StorageFileError("STORAGE_NOT_FOUND");
 return updated;
}

export async function removeLessonResourceFile(
 context:RequestContext,contentId:string,materialId:string,deliveryId:string|null,
){
 const {scope}=await authorizeWriter(context,contentId,deliveryId);
 const [row]=await getDb().select(fileSelection).from(lessonContentMaterials)
  .where(and(eq(lessonContentMaterials.id,uuid.parse(materialId)),
   eq(lessonContentMaterials.lessonContentId,contentId),
   eq(lessonContentMaterials.kind,"FILE"))).limit(1);
 if(!row||!row.storageKey||row.uploadStatus==="DELETED")
  throw new StorageFileError("STORAGE_NOT_FOUND");
 assertedResourceKey(row.storageKey,scope.collegeId);
 await getDb().update(lessonContentMaterials).set({
  uploadStatus:"DELETED",updatedAt:new Date(),
 }).where(and(eq(lessonContentMaterials.id,row.id),
  eq(lessonContentMaterials.lessonContentId,contentId),
  ne(lessonContentMaterials.uploadStatus,"DELETED")));
 try{await deleteObject(getPrivateR2Config(),row.storageKey);}catch{
  // A failed R2 cleanup cannot reinstate learner access. Retry out of band.
 }
 return {id:row.id,deleted:true as const};
}
