/** Never derive active role, password, or membership from these snapshots. */
export function legacyAccountDisplayName(input:{
 firstName:string|null;lastName:string|null;displayName:string|null;
}){
 const names=[input.firstName?.trim(),input.lastName?.trim()].filter(Boolean);
 return names.length?names.join(" "):input.displayName?.trim()||"User";
}
export function legacyPhoneNormalization(raw:string){
 const numeric=raw.replace(/[\s()-]/g,"");
 if(/^\d{10}$/.test(numeric))return "+91"+numeric;
 if(/^91\d{10}$/.test(numeric))return "+"+numeric;
 return /^\+[1-9]\d{7,14}$/.test(numeric)?numeric:null;
}
export function legacyAccountUserNameHint(raw:string|null){
 return raw?.trim().slice(0,160)||null;
}
export function archivedEmailCannotBeReused(status:string){
 return status!=="ACTIVE";
}
