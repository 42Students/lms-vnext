import {z} from "zod";
import {hrDriveDraftSchema,type HrDriveDraft} from "./hr-drive-draft-model";
const lifetime=24*60*60*1000;
export function hrDriveSessionStorageKey(userId:string,collegeId:string,fromJobId?:string|null){
 const id=z.string().uuid();
 return ["hr-request-drive-v1",id.parse(userId),id.parse(collegeId),
  fromJobId?id.parse(fromJobId):"new"].join(":");
}
export function saveHrUnsentDraft(draft:HrDriveDraft,now:number):string|null{
 const valid=hrDriveDraftSchema.safeParse(draft);
 if(!valid.success||!Number.isFinite(now)||now<0)return null;
 return JSON.stringify({version:1,savedAt:now,draft:valid.data});
}
export function restoreHrUnsentDraft(raw:string|null,now:number):HrDriveDraft|null{
 if(!raw||raw.length>20000||!Number.isFinite(now))return null;
 try{
  const envelope=z.strictObject({
   version:z.literal(1),savedAt:z.number().int().nonnegative(),draft:hrDriveDraftSchema,
  }).safeParse(JSON.parse(raw) as unknown);
  if(!envelope.success)return null;
  if(envelope.data.savedAt>now||now-envelope.data.savedAt>lifetime)return null;
  return envelope.data.draft;
 }catch{return null;}
}
