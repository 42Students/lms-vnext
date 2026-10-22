import {createPlacementCompanyInputSchema} from "./validation";

/** COL-placements-14: the college's identity-creation form must be stricter
 * than the shared cross-college API. A company cannot be matched safely using
 * only a name, and logo/content metadata cannot silently change globally. */
export const collegeCompanyCreateInputSchema=createPlacementCompanyInputSchema
 .superRefine((value,ctx)=>{
  if(!value.websiteUrl&&!value.primaryDomain)
   ctx.addIssue({code:"custom",path:["primaryDomain"],message:"Enter a website or company email domain."});
  if(value.websiteUrl&&!value.websiteUrl.startsWith("https://"))
   ctx.addIssue({code:"custom",path:["websiteUrl"],message:"Use an HTTPS website."});
  if(value.name.length>150)
   ctx.addIssue({code:"custom",path:["name"],message:"Company name must be 150 characters or fewer."});
 });

export function collegeCompanyDraftPayload(raw:{
 collegeId:string;name:string;websiteUrl:string;primaryDomain:string;
}){
 return collegeCompanyCreateInputSchema.safeParse({
  collegeId:raw.collegeId,name:raw.name,
  ...(raw.websiteUrl.trim()?{websiteUrl:raw.websiteUrl.trim()}:{}),
  ...(raw.primaryDomain.trim()?{primaryDomain:raw.primaryDomain.trim()}:{}),
  isTrusted:false,
 });
}
