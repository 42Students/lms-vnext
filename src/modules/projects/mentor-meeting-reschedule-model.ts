import {z} from "zod";
export const mentorMeetingRescheduleParamsSchema=z.object({
  projectId:z.string().uuid(),meetingId:z.string().uuid(),
}).strict();
export const mentorMeetingRescheduleSchema=z.object({
  startsAt:z.iso.datetime({offset:true}),
  endsAt:z.iso.datetime({offset:true}),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  confirmed:z.literal(true),
}).strict().superRefine((value,ctx)=>{
  const start=Date.parse(value.startsAt),end=Date.parse(value.endsAt);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||
     end-start>12*60*60*1000)
    ctx.addIssue({code:"custom",path:["endsAt"],
      message:"Meeting duration must be positive and at most 12 hours"});
});
export function mentorMeetingCanReschedule(status:string,projectStatus:string){
  return (status==="SCHEDULED"||status==="RESCHEDULED")&&
    projectStatus!=="ARCHIVED"&&projectStatus!=="COMPLETED";
}
export function toIstLocalInput(iso:string){
  const date=new Date(iso);
  if(!Number.isFinite(date.getTime()))return "";
  const parts=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23",
  }).formatToParts(date);
  const get=(part:string)=>parts.find(row=>row.type===part)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day")+"T"+get("hour")+":"+get("minute");
}
export function fromIstLocalInput(local:string){
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))return null;
  const iso=local+":00+05:30";
  const millis=Date.parse(iso);
  return Number.isFinite(millis)?new Date(millis).toISOString():null;
}
