import {z} from "zod";

/** The ten old-LMS change fields remain individually selectable. The database
 * still stores PAY/ELIGIBILITY as broad categories; legacyField keeps the
 * requested specific field on every new row. */
export const driveChangeFieldSchema=z.enum([
 "ROLE_TITLE","DESCRIPTION","LOCATION","JOB_TYPE","WORK_MODE",
 "DEADLINE","CTC","STIPEND","MIN_CGPA","BRANCHES","OTHER",
 "PAY","ELIGIBILITY","ROUNDS",
]);
/** Exact historic field selector labels, without collapsing pay questions. */
export const LEGACY_DRIVE_CHANGE_FIELD_LABELS:Readonly<Record<z.infer<typeof driveChangeFieldSchema>,string>>={
 ROLE_TITLE:"Role title",DESCRIPTION:"Description",LOCATION:"Location",
 JOB_TYPE:"Job type",WORK_MODE:"Work mode",DEADLINE:"Application deadline",
 CTC:"CTC (LPA)",STIPEND:"Monthly stipend",MIN_CGPA:"Minimum CGPA",
 BRANCHES:"Eligible branches",OTHER:"Other",
 PAY:"Pay / package",ELIGIBILITY:"Eligibility",ROUNDS:"Selection rounds",
};
/** Picker values must be the canonical job enums that the atomic change
 * service can apply. Keep legacy-friendly labels at the presentation edge. */
export const DRIVE_CHANGE_EDITOR_OPTIONS = {
 WORK_MODE: [
  {value:"ONSITE",label:"On campus"},
  {value:"HYBRID",label:"Hybrid"},
  {value:"REMOTE",label:"Remote"},
 ],
 JOB_TYPE: [
  {value:"FULL_TIME",label:"Full-time"},
  {value:"INTERNSHIP",label:"Internship"},
  {value:"CONTRACT",label:"Contract"},
 ],
} as const;

export const LEGACY_DRIVE_CHANGE_ACTION_LABELS={
 ACCEPT:"Accept",ANSWER:"Answer",DECLINE:"Reply",
 WITHDRAW:"Withdraw",COMMENT:"Comment",
} as const;

/** Legacy browser date-only fields meant the end of that civil day in
 * Asia/Kolkata; typed request fields use explicit offset instants. Do not
 * parse YYYY-MM-DD through new Date(raw), which would assume UTC and
 * accidentally close applications five and a half hours early. */
export function canonicalLegacyDriveChangeDeadline(raw:string):string{
 const value=raw.trim();
 const day=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
 if(day){
  const year=Number(day[1]),month=Number(day[2]),date=Number(day[3]);
  const test=new Date(Date.UTC(year,month-1,date));
  if(test.getUTCFullYear()!==year||test.getUTCMonth()+1!==month||
     test.getUTCDate()!==date)
   throw new Error("Invalid historical deadline date");
  return value+"T23:59:59+05:30";
 }
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||
    !Number.isFinite(Date.parse(value)))
  throw new Error("Deadline needs an explicit timezone");
 return value;
}
/** Legacy request bodies used kind/note and field labels. This adapter maps
 * them BEFORE the strict, scoped command parser, preserving typed vNext calls.
 * A legacy Reply declines the proposal with status REPLIED in the old UI;
 * it is NOT a conversational COMMENT and cannot bypass a stale version. */
export function parseLegacyDriveChangeCommand(raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return driveChangeCommandSchema.parse(raw);
 const object=raw as Record<string,unknown>;
 const {kind,note,field,...rest}=object;
 let action=rest["action"];
 if(action==="REPLY")action="DECLINE";
 if(action==="CREATE"){
  const selected=typeof field==="string"?field.trim():"";
  const normalized=selected.toUpperCase().replace(/[^A-Z0-9]+/g,"_");
  const label=Object.entries(LEGACY_DRIVE_CHANGE_FIELD_LABELS)
   .find(([,value])=>value.toUpperCase()===selected.toUpperCase())?.[0];
  const mapped=label??normalized;
  const allowed=driveChangeFieldSchema.safeParse(mapped);
  const chosen=allowed.success?allowed.data:"OTHER";
  const requestedMode=rest["mode"]??kind??(chosen==="OTHER"?"ASK":"SUGGEST");
  return driveChangeCommandSchema.parse({
   ...rest,action,field:chosen,mode:chosen==="OTHER"?"ASK":requestedMode,
   reason:rest["reason"]??note??"",
   proposedValue:chosen==="DEADLINE"&&typeof rest["proposedValue"]==="string"
     ?canonicalLegacyDriveChangeDeadline(rest["proposedValue"]):rest["proposedValue"],
  });
 }
 // COMMENT remains a message, independent from a legacy Reply decision.
 const reply=rest["action"]==="COMMENT"?{...rest,body:rest["body"]??note}:
  {...rest,action,note:rest["note"]??note};
 return driveChangeCommandSchema.parse(reply);
}
/** Only the read adapter uses the historic REPLIED label. Mutations persist
 * the canonical DECLINED state and the decision's replyText atomically. */
export function legacyDriveChangeStatus(
 status:string,replyText:string|null,
):string{
 return status==="DECLINED"&&replyText!==null?"REPLIED":status;
}

export const driveChangeCommandSchema=z.discriminatedUnion("action",[
 z.strictObject({
  action:z.literal("CREATE"),mode:z.enum(["SUGGEST","PROPOSE","ASK"]),
  field:driveChangeFieldSchema,
  proposedValue:z.string().trim().max(2000).optional().default(""),
  reason:z.string().trim().max(1000).optional().default(""),
 }).superRefine((value,ctx)=>{
  const mode=value.field==="OTHER"?"ASK":value.mode;
  if(mode==="ASK"){
   if(value.field==="OTHER" && value.reason.length<3)
    ctx.addIssue({code:"custom",path:["reason"],message:"Say what should change"});
   else if(value.field!=="OTHER" && value.proposedValue.length<2 && value.reason.length<3)
    ctx.addIssue({code:"custom",path:["proposedValue"],message:"Say what should change"});
  }else if(value.proposedValue.length<2 &&
    !(value.proposedValue.length===1&&["CTC","STIPEND","MIN_CGPA"].includes(value.field))){
   ctx.addIssue({code:"custom",path:["proposedValue"],
    message:"Give the new value, or ask for it instead"});
  }
  if(mode==="ASK")return;
  if(value.field==="PAY"||value.field==="ELIGIBILITY"){
   ctx.addIssue({code:"custom",path:["field"],message:value.field==="PAY"
     ?"Select CTC or Stipend for a proposed pay change, or Ask a question."
     :"Select Minimum CGPA or Eligible branches, or Ask a question."});
   return;
  }
  const proposed=value.proposedValue;
  if(value.field==="ROLE_TITLE"&&(proposed.length<3||proposed.length>255))
   ctx.addIssue({code:"custom",path:["proposedValue"],message:"Enter a role title (3–255 characters)"});
  if(value.field==="LOCATION"&&proposed.length>255)
   ctx.addIssue({code:"custom",path:["proposedValue"],message:"Location must be at most 255 characters"});
  if(["CTC","STIPEND","MIN_CGPA","PAY"].includes(value.field)){
   if(!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(proposed)||
     !Number.isFinite(Number(proposed))||Number(proposed)<0||
     (value.field==="CTC"&&Number(proposed)>1000)||
     (value.field==="MIN_CGPA"&&Number(proposed)>10)){
    ctx.addIssue({code:"custom",path:["proposedValue"],
     message:value.field==="MIN_CGPA"?"CGPA must be between 0 and 10":
      "Enter a nonnegative amount"+(value.field==="CTC"?" up to 1,000":"")});
   }
  }
  if(value.field==="DEADLINE"&&(!Number.isFinite(Date.parse(proposed))||
     Date.parse(proposed)<=Date.now()))
   ctx.addIssue({code:"custom",path:["proposedValue"],message:"Enter a future deadline"});
  if(value.field==="BRANCHES"&&!proposed.split(",").some(v=>v.trim()))
   ctx.addIssue({code:"custom",path:["proposedValue"],message:"Select at least one branch"});
 }),
 z.strictObject({action:z.literal("ACCEPT"),requestId:z.string().uuid(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  note:z.string().trim().max(2000).optional().default("")}),
 z.strictObject({action:z.literal("ANSWER"),requestId:z.string().uuid(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  note:z.string().trim().min(1,"Type the answer").max(2000)}),
 z.strictObject({action:z.literal("DECLINE"),requestId:z.string().uuid(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  note:z.string().trim().min(1,"Type a reason").max(1000)}),
 z.strictObject({action:z.literal("WITHDRAW"),requestId:z.string().uuid(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  note:z.string().trim().max(2000).optional().default("")}),
 z.strictObject({action:z.literal("COMMENT"),requestId:z.string().uuid(),
  body:z.string().trim().min(1).max(2000)}),
]);
