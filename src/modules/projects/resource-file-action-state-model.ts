import {resourceFileUiAllowed,type ResourceFileUiScope,type ResourceFileAction} from "./resource-file-permission-model";
export type ResourceFileActionState={enabled:boolean;reason:string|null};
/** Presentation-only affordances; server permission and signed access remain authoritative. */
export function resourceFileActionState(scope:ResourceFileUiScope,action:ResourceFileAction):ResourceFileActionState {
 if(resourceFileUiAllowed(scope,action))return {enabled:true,reason:null};
 if(!scope.projectAccessGranted||!scope.collegeMatches||scope.viewer==="NONE"||
    !scope.moduleEnabled||!scope.resourceActive)
  return {enabled:false,reason:"Files are not available for this Project resource."};
 if(action==="DOWNLOAD"&&!scope.fileVerified)
  return {enabled:false,reason:"This file has not been cleared for download."};
 if(!scope.storageReady)
  return {enabled:false,reason:"Project file storage is not available yet."};
 if(action==="UPLOAD"||action==="DELETE"){
  if(scope.projectStatus==="COMPLETED"||scope.projectStatus==="ARCHIVED")
   return {enabled:false,reason:"This Project is read-only."};
  return {enabled:false,reason:"Only authorized Project managers can change resource files."};
 }
 return {enabled:false,reason:"Resource file access is unavailable."};
}
