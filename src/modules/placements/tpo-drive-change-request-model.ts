import {z} from "zod";

/** The ten old-LMS change fields remain individually selectable. The database
 * still stores PAY/ELIGIBILITY as broad categories; legacyField keeps the
 * requested specific field on every new row. */
export const driveChangeFieldSchema=z.enum([
 "ROLE_TITLE","DESCRIPTION","LOCATION","JOB_TYPE","WORK_MODE",
 "DEADLINE","CTC","STIPEND","MIN_CGPA","BRANCHES","OTHER",
 "PAY","ELIGIBILITY","ROUNDS",
]);
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
  }else if(value.proposedValue.length<2){
   ctx.addIssue({code:"custom",path:["proposedValue"],
    message:"Give the new value, or ask for it instead"});
  }
  if(mode==="ASK")return;
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
