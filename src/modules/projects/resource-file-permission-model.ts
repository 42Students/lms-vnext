export type ResourceFileViewer="ADMIN"|"MENTOR"|"LEARNER"|"NONE";
export type ResourceFileAction="LIST"|"DOWNLOAD"|"UPLOAD"|"DELETE";
/** Presentation-only policy. projectAccessGranted comes from the server's persisted Project access check, not a client role claim. */
export type ResourceFileUiScope={
 viewer:ResourceFileViewer;projectAccessGranted:boolean;moduleEnabled:boolean;
 collegeMatches:boolean;projectStatus:"PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED";
 resourceActive:boolean;storageReady:boolean;fileVerified:boolean;
};
export function resourceFileUiAllowed(s:ResourceFileUiScope,action:ResourceFileAction){
 if(!s.moduleEnabled||!s.collegeMatches||!s.projectAccessGranted||
    s.viewer==="NONE"||!s.resourceActive)return false;
 if(action==="LIST")return true;
 if(action==="DOWNLOAD")return s.storageReady&&s.fileVerified;
 if(!s.storageReady||s.projectStatus==="ARCHIVED"||s.projectStatus==="COMPLETED")return false;
 return s.viewer==="ADMIN"||s.viewer==="MENTOR";
}
