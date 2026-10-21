/** Profile failures are intentionally non-leaking and never expose server details. */
export function facultyProfileNeedsReload(code:string|undefined){
 return code==="FACULTY_PROFILE_VERSION_CONFLICT";
}
export function facultyProfileSaveFailure(code:string|undefined,status:number):string {
 if(code==="FACULTY_PROFILE_VERSION_CONFLICT")return "Profile was updated elsewhere. Please refresh and try again.";
 if(code==="INVALID_BODY"||code==="MALFORMED_REQUEST"||code==="REQUEST_BODY_MISSING")return "Request body is missing or malformed";
 if(code==="PRIVATE_IDENTITY_STORAGE_NOT_READY")return "Private profile storage is not available. Nothing was saved.";
 if(code==="REQUEST_TOO_LARGE"||status===413)return "This profile change is too large. Shorten the text or remove extra records.";
 if(status===409)return "Profile was updated elsewhere. Please refresh and try again.";
 if(status===403)return "Your permission to edit this profile is unavailable. No changes were saved.";
 if(status===401)return "Your sign-in has expired. Sign in again before editing your profile.";
 if(status===429)return "Profile requests are being limited. Avoid repeated saves and try again later.";
 if([502,503,504].includes(status))return "Profile service is temporarily unavailable. Your unsaved draft remains in this form; verify the latest profile before trying again.";
 return "The profile change was not saved. Review the fields and try again.";
}

/** Uncertain 2xx response: the server may have committed despite an unusable receipt. */
export function facultyProfileUnconfirmedSaveMessage():string{
 return "The save response could not be verified. Your change may have been saved. Review the latest profile before submitting it again.";
}

/** Never trust untyped error JSON or expose a server exception body to the browser. */
export function facultyProfileErrorCode(raw:unknown):string|undefined{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return undefined;
 const candidate=(raw as Record<string,unknown>).error;
 if(typeof candidate!=="string"||candidate.length>128||!/^[A-Z][A-Z0-9_]*$/.test(candidate))
  return undefined;
 return candidate;
}

/** Human-facing labels are static: never echo private Faculty profile values. */
export function facultyProfileSaveSectionLabel(section:string):string {
 const labels:Record<string,string>={
  about:"About",personalDetails:"Personal details",address:"Address",
  socialProfiles:"Social profiles",languages:"Languages",education:"Education",
  certifications:"Certifications",experiences:"Experience",skills:"Skills",
  publications:"Publications",awards:"Awards",metadata:"Metadata",
 };
 return Object.hasOwn(labels,section)?labels[section]!:"Profile";
}

/** A missing server error code still needs an explicit stale-token recovery at HTTP 409. */
export function facultyProfileReloadRequired(code:string|undefined,status:number):boolean{
 return facultyProfileNeedsReload(code)||status===409;
}

/** Success labels disclose section and optimistic revision only, never profile values. */
export function facultyProfileSavedStatus(
 section:string,version:number,action:"ADD"|"UPDATE"|"DELETE"="UPDATE",
):string{
 // Legacy titles are action-specific. The optimistic version is displayed
 // separately so all mutations do not misleadingly say "saved".
 void section;
 void version;
 return action==="ADD"?"Added successfully":
  action==="DELETE"?"Deleted successfully":"Updated successfully";
}
export function facultyProfileSavedRevisionLabel(section:string,version:number):string{
 return facultyProfileSaveSectionLabel(section)+" · revision "+version;
}
