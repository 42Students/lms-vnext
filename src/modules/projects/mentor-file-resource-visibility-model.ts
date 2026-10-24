/** File uploads to a DRAFT resource are Mentor/Admin-only until an
 * explicit publish; learners can only attach to active TEAM resources.
 * Independently enforced again inside the locked upload-grant transaction.
 */
export function canAttachProjectFileToResource(
 access:"LEARNER"|"MENTOR"|"ADMIN",
 resource:{status:string;visibility:string}|null,
):boolean{
 if(!resource)return false;
 if(access==="LEARNER")return resource.status==="ACTIVE"&&resource.visibility==="TEAM";
 return resource.status==="ACTIVE"||resource.status==="DRAFT";
}
/** A metadata-only FILE/DOCUMENT placeholder may be made ACTIVE only after
 * a clean READY stored file exists, even when its description and URL are empty.
 */
export function mentorResourceNeedsVerifiedFile(input:{
 status:string;resourceType:string|null;description:string|null;url:string|null;
}):boolean{
 return input.status==="ACTIVE"&&
   (input.resourceType==="FILE"||input.resourceType==="DOCUMENT")&&
   !input.description?.trim()&&!input.url?.trim();
}
