/**
 * Client-safe legacy upload → vNext feature workflow crosswalk.
 *
 * The retired /api/v1/upload presign, multipart proxy, URL import and public
 * download endpoints are not generic fallbacks. Each feature owns scoped grant,
 * complete, list, delete and signed-read routes. A grant is NEVER an attachment
 * until its complete/attestation returns READY. Object keys are never shown.
 *
 * Legacy POST: {fileName,contentType,contentLength,folder,type,courseId,classId,
 *              lessonContentId,projectId}
 * vNext POST: {originalName,contentType,sizeBytes,...authorized parent UUIDs}
 * There is no free-form folder/key in vNext request bodies.
 */
import {
  MAX_ASSIGNMENT_FILES_PER_SUBMISSION,MAX_PROJECT_FILES_PER_PROJECT,
  MAX_VIDEOS_PER_LESSON_DELIVERY,MAX_VIDEO_BYTES,MAX_THUMBNAIL_BYTES,
  acceptAttributeFor,allowedExtensionsFor,validateStorageDeclaration,
  type StorageFileKind,type StorageDeclaration,
} from "./file-policy";
import {storageFileFriendlyMessage,type StorageFileErrorCode} from "./file-errors";

export type UploadFeature = "ASSIGNMENT"|"PROJECT"|"VIDEO"|"VIDEO_THUMBNAIL";
export type UploadStep = "SELECTING"|"UPLOADING"|"CHECKING_FILE"|"READY"|"FAILED"|
  "QUARANTINED"|"EXPIRED"|"OFFLINE"|"NOT_CONFIGURED";
export type UploadParent = {
 assignmentId?:string;deliveryId?:string;projectId?:string;lessonId?:string;videoId?:string;
};
export type LegacyUploadInput={
 fileName:unknown;contentType:unknown;contentLength:unknown;
 folder?:unknown;type?:unknown;courseId?:unknown;classId?:unknown;
 lessonContentId?:unknown;projectId?:unknown;
};

/** Server still checks membership and parent scope. This only prevents legacy
 * numeric-ID or client-supplied storage-folder fallthrough in the UI.
 */
export function featureUploadEndpoint(feature:UploadFeature,parent:UploadParent):{
 path:string;kind:StorageFileKind;countLimit:number;
}|null {
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const valid=(value:string|undefined):value is string=>Boolean(value&&uuid.test(value));
 switch(feature){
  case "ASSIGNMENT":return valid(parent.assignmentId)&&valid(parent.deliveryId)
    ?{path:"/api/courses/assignments/"+parent.assignmentId+"/submission-files",
      kind:"assignment-submission",countLimit:MAX_ASSIGNMENT_FILES_PER_SUBMISSION}:null;
  case "PROJECT":return valid(parent.projectId)
    ?{path:"/api/projects/"+parent.projectId+"/resource-files",
      kind:"project-resource",countLimit:MAX_PROJECT_FILES_PER_PROJECT}:null;
  case "VIDEO":return valid(parent.lessonId)
    ?{path:"/api/courses/lessons/"+parent.lessonId+"/videos",
      kind:"lesson-video",countLimit:MAX_VIDEOS_PER_LESSON_DELIVERY}:null;
  case "VIDEO_THUMBNAIL":return valid(parent.videoId)
    ?{path:"/api/courses/videos/"+parent.videoId+"/thumbnail",
      kind:"lesson-video-thumbnail",countLimit:1}:null;
 }
}

export function legacyUploadGrantRequest(feature:UploadFeature,parent:UploadParent,input:LegacyUploadInput):
 {ok:true;path:string;body:StorageDeclaration&{deliveryId?:string}}
 |{ok:false;message:string}{
 const endpoint=featureUploadEndpoint(feature,parent);
 if(!endpoint)return {ok:false,message:"Choose the authorized assignment, project or lesson first."};
 // Legacy raw folder, type, courseId and classId never authorize access.
 if(input.folder!==undefined||input.type!==undefined||input.courseId!==undefined||
    input.classId!==undefined||input.lessonContentId!==undefined||input.projectId!==undefined)
  return {ok:false,message:"This upload requires the current authorized file picker. Re-select the file."};
 if(typeof input.fileName!=="string"||typeof input.contentType!=="string"||
    typeof input.contentLength!=="number")
  return {ok:false,message:"Choose a file with a valid name, type and size."};
 const declaration=validateStorageDeclaration(endpoint.kind,{
  originalName:input.fileName,contentType:input.contentType,sizeBytes:input.contentLength,
 });
 if(!declaration.ok)return {ok:false,message:storageFileFriendlyMessage(declaration.code)};
 return {ok:true,path:endpoint.path,
  body:{...declaration.value,...(feature==="ASSIGNMENT"?{deliveryId:parent.deliveryId}:{} )}};
}

export function uploadPickerLimits(feature:UploadFeature,parent:UploadParent,currentCount:number){
 const route=featureUploadEndpoint(feature,parent);
 if(!route)return null;
 const count=Math.max(0,Math.floor(Number.isFinite(currentCount)?currentCount:0));
 const remaining=Math.max(0,route.countLimit-count);
 return {accept:acceptAttributeFor(route.kind),formats:allowedExtensionsFor(route.kind),
  count,limit:route.countLimit,remaining,
  addAnotherDisabled:remaining===0,
  counter:count+"/"+route.countLimit,
  message:remaining===0?
    "File limit reached ("+route.countLimit+"). Remove a file before adding another.":
    "You can add "+remaining+" more "+(remaining===1?"file.":"files."),
  uploadHint:feature==="VIDEO"?
    "Videos up to 4,900 MiB. One upload at a time; pause and resume are not supported.":
    feature==="VIDEO_THUMBNAIL"?"JPEG, PNG or WebP, up to 5 MiB.":
    "Files up to 50 MiB. Files outside the supported formats cannot be uploaded.",
 };
}

export function uploadFileLabel(raw:{originalName:string;sizeBytes:number;contentType:string}){
 const size=Math.max(0,raw.sizeBytes);
 const format=size>=1024*1024?(size/(1024*1024)).toFixed(1)+" MiB":
  size>=1024?(size/1024).toFixed(1)+" KiB":size+" B";
 return {name:raw.originalName.trim()||"Untitled file",size:format,type:raw.contentType};
}

export function storageUploadUiState(status:string|null|undefined,error?:string|null):{
 step:UploadStep;label:string;canOpen:boolean;canRetry:boolean;
}{
 if(error==="STORAGE_NOT_CONFIGURED")return {step:"NOT_CONFIGURED",label:"File storage is unavailable. Contact your administrator.",canOpen:false,canRetry:false};
 if(error==="STORAGE_PROVIDER_UNAVAILABLE")return {step:"OFFLINE",label:"File storage is temporarily unavailable. Retry when online.",canOpen:false,canRetry:true};
 if(error==="STORAGE_UPLOAD_EXPIRED")return {step:"EXPIRED",label:"Upload expired. Choose Retry to request a new upload link.",canOpen:false,canRetry:true};
 if(status==="READY")return {step:"READY",label:"Ready",canOpen:true,canRetry:false};
 if(status==="UPLOADING")return {step:"UPLOADING",label:"Uploading",canOpen:false,canRetry:true};
 if(status==="VERIFYING"||status==="PROCESSING")
  return {step:"CHECKING_FILE",label:"Checking file",canOpen:false,canRetry:true};
 if(status==="QUARANTINED"||status==="BLOCKED")
  return {step:"QUARANTINED",label:"File rejected. Choose another file.",canOpen:false,canRetry:true};
 if(status==="FAILED")return {step:"FAILED",label:"Upload failed. Retry from the beginning.",canOpen:false,canRetry:true};
 return {step:"SELECTING",label:"Choose a file",canOpen:false,canRetry:false};
}

/** Signed read/playback grants are short lived. Refresh before expiry or
 * after a storage 403; never store the grant URL in a page, log or document.
 */
export function signedReadGrantNeedsRenewal(expiresAt:string|null,now=Date.now(),earlyMs=120_000):boolean{
 if(!expiresAt)return true;
 const at=Date.parse(expiresAt);
 return !Number.isFinite(at)||at-now<=earlyMs;
}

/** Early validation, before spending mobile data on a single R2 PUT. */
export function videoSizeWarning(sizeBytes:number,thumbnail=false):string|null{
 const limit=thumbnail?MAX_THUMBNAIL_BYTES:MAX_VIDEO_BYTES;
 if(!Number.isSafeInteger(sizeBytes)||sizeBytes<=0)return "Choose a nonempty file.";
 if(sizeBytes>limit)return thumbnail?
  "Thumbnails must be 5 MiB or smaller.":"This video is too large for one upload (limit 4,900 MiB).";
 return null;
}

export function storageUploadErrorNotice(code:StorageFileErrorCode):string{
 if(code==="STORAGE_FILE_NOT_READY"||code==="STORAGE_UPLOAD_NOT_FOUND")
  return "Checking file. Upload is not complete yet; retry the completion step.";
 if(code==="STORAGE_FILE_LIMIT_REACHED")
  return "File limit reached. Remove an existing file or choose fewer files.";
 if(code==="STORAGE_UPLOAD_EXPIRED")
  return "Upload link expired. Retry from the beginning with a new link.";
 if(code==="STORAGE_PARENT_NOT_AVAILABLE")
  return "This assignment, project or lesson is not accepting uploads.";
 return storageFileFriendlyMessage(code);
}

/** URL imports and resumable proxy uploads were retired; never display their
 * old controls as if they still work or accidentally proxy arbitrary hosts.
 */
export const LEGACY_UPLOAD_UNAVAILABLE_ACTIONS=[
 "IMPORT_FROM_URL","MULTIPART_PROXY","PUBLIC_STORAGE_URL",
] as const;
