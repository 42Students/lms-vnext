/**
 * Lesson Resource FILE import and 15-minute presign compatibility.
 *
 * Old /api/v1/upload used numeric course/class IDs and returned publicUrl/key.
 * Lesson-content writer must map those IDs from trusted persisted lineage to
 * an authenticated (collegeId, offeringId, lessonContentId, deliveryId)
 * before issuing an opaque grant; client values never select a storage key.
 *
 * The existing lesson-content-materials read service only grants files with
 * uploadStatus READY, scanStatus CLEAN and attested generation. Grant/PUT alone
 * MUST NOT mark a material READY. Dev attestation isn't malware scanning.
 */
import {
 MAX_DOCUMENT_BYTES,validateStorageDeclaration,allowedExtensionsFor,
 type StorageDeclaration,
} from "./file-policy";
import {type StorageFileErrorCode} from "./file-errors";

const LEGACY_RESOURCE_MIME = new Set([
 "application/pdf","application/msword",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 "application/vnd.ms-powerpoint",
 "application/vnd.openxmlformats-officedocument.presentationml.presentation",
 "application/vnd.ms-excel",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 "text/plain","text/csv","image/jpeg","image/png","image/webp",
] as const);

/** The old Resource uploader did not expose ZIP/RTF/Markdown, although vNext
 * project files can accept them. Files with unsupported types are rejected.
 */
export const LEGACY_RESOURCE_ALLOWED_EXTENSIONS=allowedExtensionsFor("project-resource")
 .filter(extension=>!["zip","rtf","md","markdown"].includes(extension));
export const LEGACY_RESOURCE_MAX_SIZE_BYTES=MAX_DOCUMENT_BYTES;
export const LEGACY_RESOURCE_FILENAME_MAX_LENGTH=255;
export const LEGACY_RESOURCE_UPLOAD_TTL_SECONDS=15*60;

export type LegacyResourceUploadDeclaration={
 fileName:unknown;contentType:unknown;contentLength:unknown;
 courseId:unknown;classId?:unknown;
 folder?:unknown;type?:unknown;
};
export type LessonResourceUploadRequest={
 lessonContentId:string;deliveryId:string|null;originalName:string;
 contentType:string;sizeBytes:number;
};
export type LegacyResourceUploadResult=
 {ok:true;file:StorageDeclaration;sourceCourseId:number;sourceClassId:number|null}|
 {ok:false;code:StorageFileErrorCode|"INVALID_REQUEST";message:string};

export function validateLegacyResourceUpload(raw:LegacyResourceUploadDeclaration):LegacyResourceUploadResult{
 // These are *lineage hints*, never proof of course/delivery membership.
 const id=raw.courseId;
 const classId=raw.classId;
 if(typeof id!=="number"||!Number.isSafeInteger(id)||id<=0||
    (classId!=null&&(!Number.isSafeInteger(classId)||typeof classId!=="number"||classId<=0)))
  return {ok:false,code:"INVALID_REQUEST",message:"Select a course and a valid class."};
 if(raw.folder!==undefined&&raw.folder!=="lesson-content"||
   raw.type!==undefined&&raw.type!=="resource")
  return {ok:false,code:"INVALID_REQUEST",message:"Use the Resource file picker."};
 if(typeof raw.fileName!=="string"||typeof raw.contentType!=="string"||
    typeof raw.contentLength!=="number")
  return {ok:false,code:"INVALID_REQUEST",message:"File name, type and size are required."};
 if(!Number.isSafeInteger(raw.contentLength)||raw.contentLength<1||raw.contentLength>MAX_DOCUMENT_BYTES)
  return {ok:false,code:raw.contentLength>MAX_DOCUMENT_BYTES?"STORAGE_FILE_TOO_LARGE":"STORAGE_SIZE_INVALID",
   message:"Resource file must be between 1 byte and the configured size limit"};
 const declaration=validateStorageDeclaration("project-resource",{
  originalName:raw.fileName,contentType:raw.contentType,sizeBytes:raw.contentLength,
 });
 if(!declaration.ok)return {ok:false,code:declaration.code,
  message:declaration.code==="STORAGE_NAME_INVALID"?
   "Enter a Resource file name with 1–255 characters and no path separators.":
   "Unsupported Resource file name or MIME type"};
 if(!LEGACY_RESOURCE_MIME.has(declaration.value.contentType as string))
  return {ok:false,code:"STORAGE_TYPE_NOT_ALLOWED",message:"Unsupported Resource file name or MIME type"};
 return {ok:true,file:declaration.value,sourceCourseId:id,
  sourceClassId:typeof classId==="number"?classId:null};
}

/** Validate that an importer has already resolved UUID relationships to one
 * college. Does not authorize the writer; it must still require courses.manage
 * or an active teaching assignment on this particular delivery.
 */
export function validateResolvedResourceUploadScope(input:{
 collegeId:string;offeringCollegeId:string;lessonContentCollegeId:string;
 offeringId:string;contentOfferingId:string;deliveryOfferingId?:string|null;
 lessonContentId:string;deliveryId:string|null;file:StorageDeclaration;
}):{ok:true;request:LessonResourceUploadRequest}|{ok:false;message:string}{
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(![input.collegeId,input.offeringCollegeId,input.lessonContentCollegeId,
   input.offeringId,input.contentOfferingId,input.lessonContentId].every(value=>uuid.test(value))||
   input.collegeId!==input.offeringCollegeId||
   input.collegeId!==input.lessonContentCollegeId||
   input.offeringId!==input.contentOfferingId||
   input.deliveryId!==null&&(!uuid.test(input.deliveryId)||input.deliveryOfferingId!==input.offeringId))
  return {ok:false,message:"This Resource is not part of the selected course and class."};
 const valid=validateStorageDeclaration("project-resource",input.file);
 if(!valid.ok||!LEGACY_RESOURCE_MIME.has(valid.value.contentType as string))
  return {ok:false,message:"Choose a supported Resource file up to 50 MiB."};
 return {ok:true,request:{lessonContentId:input.lessonContentId,
  deliveryId:input.deliveryId,...valid.value}};
}

/** Status strings are intentionally distinct from upload percentage. The
 * server verifies the PUT object, hash/size and scan before any Open action.
 */
export function lessonResourceUploadStatus(
 status:"UPLOADING"|"VERIFYING"|"READY"|"QUARANTINED"|"FAILED"|"DELETED",
 scanStatus:"PENDING"|"CLEAN"|"REJECTED",
){
 if(status==="READY"&&scanStatus==="CLEAN")return {label:"Ready",canOpen:true};
 if(status==="VERIFYING")return {label:"Checking file",canOpen:false};
 if(status==="UPLOADING")return {label:"Uploading",canOpen:false};
 if(status==="QUARANTINED")return {label:"Resource file rejected",canOpen:false};
 if(status==="FAILED")return {label:"Upload failed. Retry with a new upload link.",canOpen:false};
 return {label:"Unavailable",canOpen:false};
}

/** A secure Response projects only id + signed grant, not old publicUrl/key.
 * The R2 key stays in the server-side DB under one immutable college/content.
 */
export function legacyResourceUploadGrantProjection(input:{
 fileId:string;uploadUrl:string;expiresAt:Date;requiredHeaders:Record<string,string>;
 originalName:string;
}){
 return {fileId:input.fileId,method:"PUT" as const,uploadUrl:input.uploadUrl,
  expiresAt:input.expiresAt.toISOString(),expiresInSeconds:LEGACY_RESOURCE_UPLOAD_TTL_SECONDS,
  requiredHeaders:input.requiredHeaders,originalName:input.originalName,
  nextStep:"PUT_THEN_COMPLETE" as const};
}
