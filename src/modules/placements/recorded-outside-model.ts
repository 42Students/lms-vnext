import {z} from "zod";
export const recordedOutsideDriveSchema=z.strictObject({
 collegeId:z.string().uuid(),
 companyRelationshipId:z.string().uuid(),
 title:z.string().trim().min(3).max(200),
 occurredAt:z.union([z.date(),z.iso.datetime({offset:true}).transform(value=>new Date(value))]),
 externalReferenceUrl:z.url().max(2000).refine(value=>{
  try{
   const url=new URL(value);
   return url.protocol==="https:"&&!url.username&&!url.password&&!url.hash;
  }catch{return false;}
 }).optional(),
 notes:z.string().trim().max(1000).optional(),
}).refine(v=>v.occurredAt.getTime()<=Date.now(),{
 message:"External drive occurrence cannot be in the future",
});
export function outsideDriveIsPlatformJob(){return false as const;}
