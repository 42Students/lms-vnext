/** Source integer identity is never a valid tenant routing parameter.
 * Restoring a name reused by another active organization is a conflict,
 * not an implicit rename, merge, or ownership transfer. */
export function legacyOrganizationStatus(wasDeleted:boolean|null){
 return wasDeleted===true?"ARCHIVED" as const:"ACTIVE" as const;
}
export function canRestoreArchivedOrganization(input:{
 archived:boolean;name:string;activeNames:readonly string[];
}){
 if(!input.archived)return {allowed:false,reason:"NOT_ARCHIVED" as const};
 if(input.activeNames.some(name=>name.trim().toLocaleLowerCase()===input.name.trim().toLocaleLowerCase()))
  return {allowed:false,reason:"NAME_CONFLICT" as const};
 return {allowed:true,reason:null};
}
