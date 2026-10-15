/** Profile failures are intentionally non-leaking and never expose server details. */
export function facultyProfileNeedsReload(code:string|undefined){
 return code==="FACULTY_PROFILE_VERSION_CONFLICT";
}
export function facultyProfileSaveFailure(code:string|undefined,status:number):string {
 if(code==="FACULTY_PROFILE_VERSION_CONFLICT")return "Your profile changed since you opened it. Reload the latest version before editing again.";
 if(code==="PRIVATE_IDENTITY_STORAGE_NOT_READY")return "Private profile storage is not available. Nothing was saved.";
 if(code==="REQUEST_TOO_LARGE"||status===413)return "This profile change is too large. Shorten the text or remove extra records.";
 if(status===403)return "Your permission to edit this profile is unavailable. No changes were saved.";
 return "The profile change was not saved. Review the fields and try again.";
}

/** Uncertain 2xx response: the server may have committed despite an unusable receipt. */
export function facultyProfileUnconfirmedSaveMessage():string{
 return "The save response could not be verified. Your change may have been saved. Review the latest profile before submitting it again.";
}
