export type ResourceFileViewer="ADMIN"|"MENTOR"|"LEARNER"|"NONE";
export type ResourceFileAction="LIST"|"DOWNLOAD"|"UPLOAD"|"DELETE";
/** Presentation-only policy. Must be recomputed by the server with persisted college/project membership. */
export type ResourceFileUiScope={
 viewer:ResourceFileViewer;assignedToProject:boolean;moduleEnabled:boolean;
 collegeMatches:boolean;projectStatus:"PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED";
 resourceActive:boolean;storageReady:boolean;fileVerified:boolean;
};
export function resourceFileUiAllowed(s:ResourceFileUiScope,action:ResourceFileAction){
 if(!s.moduleEnabled||!s.collegeMatches||!s.assignedToProject||
    s.viewer==="NONE"||!s.resourceActive)return false;
 if(action==="LIST")return true;
 if(action==="DOWNLOAD")return s.storageReady&&s.fileVerified;
 if(!s.storageReady||s.projectStatus==="ARCHIVED"||s.projectStatus==="COMPLETED")return false;
 return s.viewer==="ADMIN"||s.viewer==="MENTOR";
}
