import {z} from "zod";
const id=z.string().uuid();
/** Storage accepts the legacy InterviewForm's 255-character interviewer and
 * 500-character venue. Notes use the versioned outcome reason (up to 1000).
 * College-configured duration bounds may be narrower than the safe 5–480
 * minute server guard; the UI can call this pure helper before submission.
 */
export function collegeInterviewDurationBounds(settings?:{
 minMinutes?:number|null;maxMinutes?:number|null;defaultMinutes?:number|null;
}){
 const min=Number.isInteger(settings?.minMinutes)&&Number(settings?.minMinutes)>=5
   ?Math.min(480,Number(settings?.minMinutes)):5;
 const max=Number.isInteger(settings?.maxMinutes)&&Number(settings?.maxMinutes)>=min
   ?Math.min(480,Number(settings?.maxMinutes)):480;
 const initial=Number.isInteger(settings?.defaultMinutes)?Number(settings?.defaultMinutes):60;
 return {min,max,defaultMinutes:Math.max(min,Math.min(max,initial))};
}
function isSafeInterviewMeetingUrl(value:string|null){
 if(!value)return false;
 try{
  const url=new URL(value);
  return url.protocol==="https:"&&!url.username&&!url.password&&
   Boolean(url.hostname.includes("."))&&url.hostname!=="localhost"&&
   !url.hostname.endsWith(".localhost");
 }catch{return false;}
}
const appointment=z.object({
 roundId:id,applicationId:id,scheduledAt:z.iso.datetime({offset:true}),
 durationMinutes:z.number().int().min(5).max(480),
 // Legacy interview vocabulary; optional for already-versioned round clients.
 interviewType:z.enum(["SCREENING","TECHNICAL","HR","MANAGERIAL","FINAL"],
  {error:"Please select interview type"}).optional(),
 roundDescription:z.string().trim().min(10,"Please add at least a short description (min 10 characters)")
  .max(500).optional(),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]),venue:z.string().trim().max(500).nullable(),
 meetingUrl:z.url("Please enter a valid meeting link starting with https://").max(500).nullable(),interviewer:z.string().trim().max(255).nullable(),
}).strict().superRefine((x,c)=>{
 if(x.mode==="ON_CAMPUS"&&(!x.venue||x.venue.length<2))
  c.addIssue({code:"custom",path:["venue"],message:"Enter the interview location."});
 if(x.mode==="VIRTUAL"&&!x.meetingUrl)
  c.addIssue({code:"custom",path:["meetingUrl"],message:"Please enter the meeting link"});
 else if(x.mode==="VIRTUAL"&&!isSafeInterviewMeetingUrl(x.meetingUrl))
  c.addIssue({code:"custom",path:["meetingUrl"],message:"Please enter a valid meeting link starting with https://"});
});
/** New schedules require the legacy interview type and meaningful description.
 * Editing imported appointments is compatible with missing historic fields.
 */
const newAppointment=appointment.superRefine((value,ctx)=>{
 if(!value.interviewType)ctx.addIssue({
  code:"custom",path:["interviewType"],message:"Please select interview type",
 });
 if(!value.roundDescription)ctx.addIssue({
  code:"custom",path:["roundDescription"],
  message:"Please add at least a short description (min 10 characters)",
 });
});
export const collegeInterviewActionSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("SCHEDULE"),confirmed:z.literal(true),appointment:newAppointment}).strict(),
 z.object({action:z.literal("EDIT"),confirmed:z.literal(true),interviewId:id,expectedVersion:z.number().int().positive(),
  appointment,reason:z.string().trim().min(3).max(500),
  notes:z.string().trim().max(1000).optional()}).strict(),
 z.object({action:z.enum(["CANCEL","COMPLETED","NO_SHOW"]),confirmed:z.literal(true),
  interviewId:id,expectedVersion:z.number().int().positive(),
  reason:z.string().trim().min(3).max(1000)}).strict(),
]);
