import { guessContentTypeFromName, storageErrorMessage, validateStorageDeclaration, type StorageFileKind } from "@/modules/storage/ui-models";
import { parseFacultyVideoUploadGrant, managedVideoAfterAction, type ManagedVideo } from "@/modules/courses/faculty-video-storage-model";
import { storageApiError } from "@/modules/courses/learner-storage-ui-model";
import { putStagedAssignmentBytes } from "./assignment-staged-file-transfer";

type PutBytes=typeof putStagedAssignmentBytes;
export function checkedFacultyVideoFile(file:File,kind:StorageFileKind){
 const outcome=validateStorageDeclaration(kind,{
  originalName:file.name, contentType:file.type || guessContentTypeFromName(kind,file.name) || "",
  sizeBytes:file.size,
 });
 if(!outcome.ok)throw new Error(storageErrorMessage(outcome.code));
 return outcome.value;
}
async function postJson(url:string,body:unknown,signal:AbortSignal,fetcher:typeof fetch){
 const response=await fetcher(url,{
  method:"POST",credentials:"same-origin",cache:"no-store",signal,
  headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
 });
 if(!response.ok)throw new Error(await storageApiError(response));
 return response.json() as Promise<unknown>;
}
async function completeVideoUpload(videoId:string,lessonId:string,thumbnail:boolean,signal:AbortSignal,fetcher:typeof fetch){
 const path=`/api/courses/videos/${encodeURIComponent(videoId)}/${thumbnail?"thumbnail/complete":"complete"}`;
 for(let attempt=0;attempt<3;attempt++){
  const response=await fetcher(path,{method:"POST",credentials:"same-origin",cache:"no-store",signal});
  if(response.ok)return managedVideoAfterAction(await response.json(),videoId,lessonId);
  const error=await response.json() as {error?:string};
  if(response.status!==409||error.error!=="STORAGE_UPLOAD_NOT_FOUND"||attempt===2)
    throw new Error(storageErrorMessage(error.error));
  await new Promise<void>((resolve,reject)=>{
   if(signal.aborted){reject(new DOMException("Upload cancelled","AbortError"));return;}
   const done=()=>{clearTimeout(timer);reject(new DOMException("Upload cancelled","AbortError"));};
   const timer=setTimeout(()=>{signal.removeEventListener("abort",done);resolve();},600);
   signal.addEventListener("abort",done,{once:true});
  });
 }
 throw new Error("Could not verify the file.");
}

export async function uploadFacultyLessonVideo(args:{
 lessonId:string;deliveryId:string|null;title:string;durationSeconds:number|null;file:File;
 replaceVideoId?:string; signal:AbortSignal;onProgress:(n:number)=>void;
},fetcher:typeof fetch=fetch,putBytes:PutBytes=putStagedAssignmentBytes):Promise<ManagedVideo>{
 const declared=checkedFacultyVideoFile(args.file,"lesson-video");
 const payload={
  title:args.title.trim(),deliveryId:args.deliveryId,
  ...declared,
  ...(args.durationSeconds===null?{}:{durationSeconds:args.durationSeconds}),
  ...(args.replaceVideoId?{replaceVideoId:args.replaceVideoId}:{}),
 };
 const result=await postJson(`/api/courses/lessons/${encodeURIComponent(args.lessonId)}/videos`,payload,args.signal,fetcher);
 const {video,grant}=parseFacultyVideoUploadGrant(result,Date.now(),{
  lessonId:args.lessonId,deliveryId:args.deliveryId,fileName:args.file.name,
  contentType:declared.contentType,sizeBytes:args.file.size,
 });
 if(args.replaceVideoId && video.replacesVideoId!==args.replaceVideoId)
  throw new Error("Replacement upload does not match the selected video.");
 await putBytes(grant.uploadUrl,grant.requiredHeaders,args.file,args.signal,args.onProgress);
 return completeVideoUpload(video.id,args.lessonId,false,args.signal,fetcher);
}
export async function uploadFacultyLessonThumbnail(args:{
 video:ManagedVideo;file:File;signal:AbortSignal;onProgress:(n:number)=>void;
},fetcher:typeof fetch=fetch,putBytes:PutBytes=putStagedAssignmentBytes):Promise<ManagedVideo>{
 const declared=checkedFacultyVideoFile(args.file,"lesson-video-thumbnail");
 const result=await postJson(`/api/courses/videos/${encodeURIComponent(args.video.id)}/thumbnail`,declared,args.signal,fetcher);
 const {grant}=parseFacultyVideoUploadGrant(result,Date.now(),{
  lessonId:args.video.lessonId,deliveryId:args.video.deliveryId,fileName:args.file.name,
  contentType:declared.contentType,sizeBytes:args.file.size,
 },args.video.id);
 await putBytes(grant.uploadUrl,grant.requiredHeaders,args.file,args.signal,args.onProgress);
 return completeVideoUpload(args.video.id,args.video.lessonId,true,args.signal,fetcher);
}
