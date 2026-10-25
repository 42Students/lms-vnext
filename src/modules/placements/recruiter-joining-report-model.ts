import {z} from "zod";
/** A recruiter may report a joining outcome for TPO verification, not update
 * the authoritative placement_joining_outcomes table directly. */
export const recruiterJoiningReportSchema=z.strictObject({
 status:z.enum(["JOINED","DEFERRED","DID_NOT_JOIN"]),
 reportedDate:z.string().optional().default(""),
 reason:z.string().trim().max(1000).default(""),
}).superRefine((data,ctx)=>{
 const needsDate=data.status==="JOINED"||data.status==="DEFERRED";
 if(needsDate){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(data.reportedDate);
  const valid=match&&Number(match[1])>=2000&&Number(match[1])<=2100&&
   new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]))).toISOString().slice(0,10)===data.reportedDate;
  if(!valid)ctx.addIssue({code:"custom",path:["reportedDate"],message:"Choose a valid joining date"});
 }
 if(data.status==="DID_NOT_JOIN"&&data.reason.length<3)
  ctx.addIssue({code:"custom",path:["reason"],message:"Explain why the applicant did not join"});
});
export function recruiterJoiningReportMessage(input:{
 offerId:string;candidate:string;drive:string;
 status:"JOINED"|"DEFERRED"|"DID_NOT_JOIN";reportedDate:string;reason:string;
}):string{
 const safe=(value:string,max=140)=>value.trim().replace(/[\x00-\x1f\x7f]+/g," ").slice(0,max);
 const parsed=recruiterJoiningReportSchema.parse({
  status:input.status,reportedDate:input.reportedDate,reason:input.reason,
 });
 return [
  "Joining update for placement-cell verification (not an applied outcome)",
  "Drive: "+safe(input.drive),
  "Applicant: "+safe(input.candidate),
  "Offer reference: "+safe(input.offerId,36),
  "Recruiter reports: "+parsed.status.replaceAll("_"," "),
  ...(parsed.status!=="DID_NOT_JOIN"?["Date: "+parsed.reportedDate]:[]),
  ...(parsed.reason?["Notes: "+safe(parsed.reason,1000)]:[]),
  "Please verify and record this under the college's official joining workflow.",
 ].join("\n");
}
