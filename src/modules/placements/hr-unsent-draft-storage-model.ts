import {z} from "zod";
import {hrDriveDraftSchema,emptyHrDriveDraft,type HrDriveDraft} from "./hr-drive-draft-model";
import {hrDraftContainsWork} from "./hr-draft-reset-model";
const lifetime=24*60*60*1000;
export function hrDriveSessionStorageKey(userId:string,collegeId:string,fromJobId?:string|null){
 const id=z.string().uuid();
 return ["hr-request-drive-v1",id.parse(userId),id.parse(collegeId),
  fromJobId?id.parse(fromJobId):"new"].join(":");
}
/** Browser-only drafts may contain incomplete input. They are NEVER sent to
 * the server until the strict submission schema validates them. */
function isEditableHrDraft(value:unknown):value is HrDriveDraft{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const fields=value as Record<string,unknown>;
 const template=emptyHrDriveDraft() as Record<string,unknown>;
 if(Object.keys(fields).some(key=>!(key in template)))return false;
 for(const [key,example] of Object.entries(template)){
  const field=fields[key];
  if(Array.isArray(example)){
   if(!Array.isArray(field))return false;
   if(key==="branches" && (field.length>30||
     !field.every(x=>typeof x==="string"&&x.length<=120)))return false;
   if(key==="rounds"&&(field.length>12||!field.every(x=>
     x&&typeof x==="object"&&!Array.isArray(x)&&
     ["TALK","TEST","VENDOR_TEST","GD","INTERVIEW"].includes((x as {kind:string}).kind)&&
     typeof (x as {name:unknown}).name==="string"&&
     (x as {name:string}).name.length<=120)))return false;
  }else if(typeof example==="string" &&
    (typeof field!=="string"||field.length>5000))return false;
 }
 return true;
}
export function saveHrUnsentDraft(draft:HrDriveDraft,now:number):string|null{
 if(!Number.isFinite(now)||now<0||!isEditableHrDraft(draft)||!hrDraftContainsWork(draft))return null;
 const raw=JSON.stringify({version:2,savedAt:now,draft});
 return raw.length<=20000?raw:null;
}
export function restoreHrUnsentDraft(raw:string|null,now:number):HrDriveDraft|null{
 if(!raw||raw.length>20000||!Number.isFinite(now))return null;
 try{
  const input:unknown=JSON.parse(raw);
  if(!input||typeof input!=="object"||Array.isArray(input))return null;
  const envelope=input as Record<string,unknown>;
  if(typeof envelope.savedAt!=="number"||!Number.isInteger(envelope.savedAt)||
      envelope.savedAt>now||now-envelope.savedAt>lifetime)return null;
  if(envelope.version===1){
    const valid=hrDriveDraftSchema.safeParse(envelope.draft);
    return valid.success?valid.data:null;
  }
  return envelope.version===2&&isEditableHrDraft(envelope.draft)?envelope.draft:null;
 }catch{return null;}
}

/** The same URL path can switch between NEW, FROM, COPY, EDIT and FIX while
 * React preserves the page slot. Key the hook-owning draft by principal,
 * tenant, mode and source ID to prevent cross-college or cross-request state. */
export function hrDriveDraftFormStateKey(
 userId:string,collegeId:string,
 mode:"NEW"|"FROM"|"COPY"|"EDIT"|"FIX",sourceId:string|null,
):string {
 return [userId,collegeId,mode,sourceId??"new"].join(":");
}
