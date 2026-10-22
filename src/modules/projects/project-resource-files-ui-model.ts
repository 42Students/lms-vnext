import {
  guessContentTypeFromName, isSafeSignedUrl, fileStatusDescriptor,
  storageErrorMessage, type FileStatus,
} from "@/modules/storage/ui-models";
import {validateStorageDeclaration} from "@/modules/storage/file-policy";

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
  const result=validateStorageDeclaration("project-resource",{
    originalName:file.name,contentType:file.type||guessContentTypeFromName("project-resource",file.name)||"",
    sizeBytes:file.size,
  });
  return result.ok?{ok:true as const,...result.value}:{ok:false as const,error:result.code};
}
/** Check grants before any cross-origin PUT. Never expose or persist uploadUrl. */
export function validProjectResourceUploadGrant(value:unknown):value is ProjectResourceUploadGrant{
  if(!value||typeof value!=="object")return false;
  const x=value as Record<string,unknown>;
  return typeof x["fileId"]==="string"&&x["method"]==="PUT"&&
    typeof x["uploadUrl"]==="string"&&isSafeSignedUrl(x["uploadUrl"])&&
    typeof x["expiresAt"]==="string"&&Number.isFinite(Date.parse(x["expiresAt"]))&&
    typeof x["requiredHeaders"]==="object"&&x["requiredHeaders"]!==null&&
    !Array.isArray(x["requiredHeaders"])&&
    Object.entries(x["requiredHeaders"]).every(([k,v])=>
      typeof v==="string"&&(k.toLowerCase()==="content-type"||k.toLowerCase().startsWith("x-amz-meta-")));
}
export function projectFileUsable(file:Pick<ProjectResourceFile,"status">){
  return fileStatusDescriptor(file.status).usable;
}
