import {z} from "zod";
import {parseIstRoundLocalTime} from "./tpo-round-calendar-model";
export const tpoInterviewRescheduleSchema=z.object({
 confirmed:z.literal(true),
 expectedUpdatedAt:z.iso.datetime({offset:true}).transform(value=>new Date(value).toISOString()),
 localDateTime:z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]),
 venue:z.string().trim().min(1).max(500).optional(),
 meetingUrl:z.url({protocol:/^https?$/}).max(2000).optional(),
 reason:z.string().trim().min(10).max(1000),
}).strict().superRefine((value,ctx)=>{
 if(value.mode==="ON_CAMPUS"&&!value.venue)ctx.addIssue({
  code:"custom",path:["venue"],message:"On-campus rescheduling requires a venue"});
 if(value.mode==="VIRTUAL"&&!value.meetingUrl)ctx.addIssue({
  code:"custom",path:["meetingUrl"],message:"Virtual rescheduling requires a meeting URL"});
});
export function validInterviewWindow(start:Date,now:Date,durationMinutes:number|null){
 return start.getTime()>now.getTime()&&
  (durationMinutes===null||durationMinutes>0);
}
export function overlappingInterviewVenue(
 proposedStart:Date,durationMinutes:number,
 existing:readonly {start:Date;durationMinutes:number|null}[],
){
 const start=proposedStart.getTime(),end=start+durationMinutes*60_000;
 return existing.some(item=>{
  if(item.durationMinutes===null||item.durationMinutes<=0)return true;
  const existingStart=item.start.getTime();
  return existingStart<end&&start<existingStart+item.durationMinutes*60_000;
 });
}
export {parseIstRoundLocalTime};
