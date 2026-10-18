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
    (projectStatus==="PLANNED"||projectStatus==="ACTIVE");
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
  // Calendar-exact: Date.parse accepts and normalizes impossible dates
  // such as 30 February. Never reschedule a meeting on an unintended day.
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))return null;
  const year=Number(local.slice(0,4)),month=Number(local.slice(5,7));
  const day=Number(local.slice(8,10)),hour=Number(local.slice(11,13));
  const minute=Number(local.slice(14,16));
  if(year<2000||year>9999||month<1||month>12||day<1||day>31||
    hour>23||minute>59)return null;
  const normalized=new Date(Date.UTC(year,month-1,day,hour,minute));
  if(normalized.getUTCFullYear()!==year||normalized.getUTCMonth()+1!==month||
    normalized.getUTCDate()!==day||normalized.getUTCHours()!==hour||
    normalized.getUTCMinutes()!==minute)return null;
  return new Date(normalized.getTime()-330*60_000).toISOString();
}
