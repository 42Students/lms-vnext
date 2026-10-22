import {z} from "zod";
import {hrDriveDraftSchema,emptyHrDriveDraft,type HrDriveDraft} from "./hr-drive-draft-model";
import {hrDraftContainsWork} from "./hr-draft-reset-model";
const lifetime=24*60*60*1000;
export function hrDriveSessionStorageKey(userId:string,collegeId:string,fromJobId?:string|null){
 const id=z.string().uuid();
 return ["hr-request-drive-v1",id.parse(userId),id.parse(collegeId),
  fromJobId?id.parse(fromJobId):"new"].join(":");
}
/** Read-only migration hint for the old browser key. Do not combine an
 * unnamed old request with an explicitly chosen "Hire again" source.
 * Old versions did not timestamp drafts, so restoration must be
 * user-confirmed rather than silently replacing a current 24-hour draft. */
export function legacyRecruiterDraftStorageKey(
 userId:string,collegeId:string,sourceId?:string|null,
):string|null{
 if(sourceId)return null;
 const uuid=z.string().uuid();
 return "recruiter-drive-draft:"+uuid.parse(userId)+":"+uuid.parse(collegeId);
}
export type LegacyHrDraftRecovery={
 status:"REVIEW_REQUIRED"|"UNAVAILABLE";
 draft:HrDriveDraft|null;
 notice:string;
};
export const HR_UNSENT_DRAFT_EXPIRY_MESSAGE=
 "Unsent requests are kept in this browser for up to 24 hours. Expired drafts cannot be restored automatically.";
/** The old JSON envelope was {values,rounds} with no saved timestamp.
 * Only whitelist known authoring fields; never carry over a learner/company
 * identifier, a source request ID or arbitrary JS/HTML into a new tenant.
 */
export function inspectLegacyRecruiterUnsentDraft(
 raw:string|null,mode:"NEW"|"FROM"|"COPY"|"EDIT"|"FIX",
):LegacyHrDraftRecovery{
 const unavailable:LegacyHrDraftRecovery={
  status:"UNAVAILABLE",draft:null,notice:"No legacy draft is available for this new request.",
 };
 if(mode!=="NEW"||!raw||raw.length>20000)return unavailable;
 try{
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return unavailable;
  const entry=parsed as Record<string,unknown>;
  if(!entry["values"]||typeof entry["values"]!=="object"||Array.isArray(entry["values"]))
   return unavailable;
  const values=entry["values"] as Record<string,unknown>;
  const draft=emptyHrDriveDraft();
  const text=(field:string)=>typeof values[field]==="string"?values[field] as string:"";
  const bounded=(field:string,max:number)=>text(field).slice(0,max);
  const jobType=text("jobType");
  draft.title=bounded("jobTitle",200);
  draft.description=bounded("jobDescription",5000);
  draft.jdUrl=bounded("jdUrl",2000);
  draft.location=bounded("location",180);
  draft.employmentType=jobType==="Internship"?"INTERNSHIP":
   jobType==="Internship + full-time"?"INTERNSHIP_FULL_TIME":"FULL_TIME";
  draft.driveMode=values["driveMode"]==="OFF_CAMPUS"?"OFF_CAMPUS":"ON_CAMPUS";
  draft.ctcLpa=String(values["ctcLpa"]??"").slice(0,12);
  draft.fixedLpa=String(values["fixedLpa"]??"").slice(0,12);
  draft.variableLpa=String(values["variableLpa"]??"").slice(0,12);
  draft.stipendMonthlyInr=String(values["stipendPerMonth"]??"").slice(0,9);
  draft.minimumCgpa=String(values["minCgpa"]??"").slice(0,8);
  draft.branches=Array.isArray(values["branches"])?
   values["branches"].filter((value):value is string=>typeof value==="string")
    .slice(0,30).map(value=>value.slice(0,120)):[];
  draft.passingYears=Array.isArray(values["passingYears"])?
   [...new Set(values["passingYears"].map(Number).filter(year=>
    Number.isInteger(year)&&year>=2000&&year<=2100))].slice(0,101):[];
  draft.rounds=Array.isArray(entry["rounds"])?
   entry["rounds"].filter((row):row is {kind:"TALK"|"TEST"|"VENDOR_TEST"|"GD"|"INTERVIEW";name:string}=>
    Boolean(row)&&typeof row==="object"&&
    ["TALK","TEST","VENDOR_TEST","GD","INTERVIEW"].includes((row as {kind?:unknown}).kind as string)&&
    typeof (row as {name?:unknown}).name==="string")
    .slice(0,12).map(row=>({kind:row.kind,name:row.name.slice(0,120)})):[];
  if(!isEditableHrDraft(draft)||!hrDraftContainsWork(draft))return unavailable;
  return {status:"REVIEW_REQUIRED",draft,
   notice:"A draft from the old recruiter workspace was found without a save date. Review every field before choosing to restore it; it was not submitted."};
 }catch{return unavailable;}
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
  if(typeof envelope["savedAt"]!=="number"||!Number.isInteger(envelope["savedAt"])||
      envelope["savedAt"]>now||now-envelope["savedAt"]>lifetime)return null;
  if(envelope["version"]===1){
    const valid=hrDriveDraftSchema.safeParse(envelope["draft"]);
    return valid.success?valid.data:null;
  }
  return envelope["version"]===2&&isEditableHrDraft(envelope["draft"])?envelope["draft"]:null;
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

/** Never hide a saved draft merely because storage deletion was attempted.
 * Browsers may block/removeItem independently for local and session stores. */
export function clearHrUnsentDraftStores(
 stores:readonly Pick<Storage,"removeItem"|"getItem">[],storageKey:string,
):boolean{
 if(!storageKey||stores.length===0)return false;
 try{
  for(const store of stores)store.removeItem(storageKey);
  return stores.every(store=>store.getItem(storageKey)===null);
 }catch{return false;}
}
