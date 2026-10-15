import {
  MAX_DOCUMENT_BYTES, allowedMimeTypesFor, allowedExtensionsFor,
  guessContentTypeFromName, isSafeSignedUrl, fileStatusDescriptor,
  storageErrorMessage, type FileStatus,
} from "@/modules/storage/ui-models";

export type ProjectResourceFile = {
  id:string; projectId:string; resourceId:string|null;
  title:string; description:string|null; originalName:string;
  contentType:string; sizeBytes:number; status:FileStatus;
  failureCode:string|null; createdAt:string; completedAt:string|null;
};
export type ProjectResourceUploadGrant = {
  fileId:string; method:"PUT"; uploadUrl:string; expiresAt:string;
  requiredHeaders:Record<string,string>; originalName:string;
};
export {fileStatusDescriptor,storageErrorMessage};
export const PROJECT_FILE_LIMIT=200;
export function projectResourceFileDeclaration(file:Pick<File,"name"|"size"|"type">){
  const originalName=file.name;
  if(!originalName||originalName.length>255||/[\\/\\\\\\u0000-\\u001f]/.test(originalName))
    return {ok:false as const,error:"STORAGE_NAME_INVALID"};
  if(!Number.isSafeInteger(file.size)||file.size<=0)
    return {ok:false as const,error:"STORAGE_SIZE_INVALID"};
  if(file.size>MAX_DOCUMENT_BYTES)
    return {ok:false as const,error:"STORAGE_FILE_TOO_LARGE"};
  const contentType=file.type||guessContentTypeFromName("project-resource",originalName);
  if(!contentType||!allowedMimeTypesFor("project-resource").includes(contentType))
    return {ok:false as const,error:"STORAGE_TYPE_NOT_ALLOWED"};
  const extension=originalName.split(".").pop()?.toLowerCase();
  if(!extension||!allowedExtensionsFor("project-resource").some(x=>x.toLowerCase().replace(/^\\./,"")===extension))
    return {ok:false as const,error:"STORAGE_EXTENSION_MISMATCH"};
  return {ok:true as const,originalName,contentType,sizeBytes:file.size};
}
/** Check grants before any cross-origin PUT. Never expose or persist uploadUrl. */
export function validProjectResourceUploadGrant(value:unknown):value is ProjectResourceUploadGrant{
  if(!value||typeof value!=="object")return false;
  const x=value as Record<string,unknown>;
  return typeof x.fileId==="string"&&x.method==="PUT"&&
    typeof x.uploadUrl==="string"&&isSafeSignedUrl(x.uploadUrl)&&
    typeof x.expiresAt==="string"&&Number.isFinite(Date.parse(x.expiresAt))&&
    typeof x.requiredHeaders==="object"&&x.requiredHeaders!==null&&
    !Array.isArray(x.requiredHeaders)&&
    Object.entries(x.requiredHeaders).every(([k,v])=>
      typeof v==="string"&&(k.toLowerCase()==="content-type"||k.toLowerCase().startsWith("x-amz-meta-")));
}
export function projectFileUsable(file:Pick<ProjectResourceFile,"status">){
  return fileStatusDescriptor(file.status).usable;
}
