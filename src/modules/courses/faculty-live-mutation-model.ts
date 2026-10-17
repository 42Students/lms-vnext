import { z } from "zod";

export const facultyLiveMutationParamsSchema=z.object({
  deliveryId:z.string().uuid(),
}).strict();
const httpsMeeting=z.string().url().max(1200).refine(value=>{
  try {
    const parsed=new URL(value);
    const allowed=["zoom.us","teams.microsoft.com","meet.google.com","webex.com","whereby.com"];
    const host=parsed.hostname.toLowerCase();
    return allowed.some(domain=>host===domain||host.endsWith("."+domain)) &&
      parsed.protocol==="https:" && !!parsed.hostname &&
      !parsed.username && !parsed.password &&
      parsed.hostname!=="localhost" && !parsed.hostname.endsWith(".localhost");
  }catch{return false;}
},"HTTPS meeting link required");
const time=z.iso.datetime({offset:true});
const fields=z.object({
  title:z.string().trim().min(3).max(160),
  meetingUrl:httpsMeeting,
  startsAt:time,endsAt:time,
}).strict();
export const facultyLiveMutationSchema=z.discriminatedUnion("action",[
  fields.extend({
    action:z.literal("CREATE"),lessonId:z.string().uuid(),
    confirm:z.literal(true),
  }),
  fields.extend({
    action:z.literal("EDIT"),contentId:z.string().uuid(),
    expectedUpdatedAt:time,confirm:z.literal(true),
  }),
  z.object({
    action:z.literal("CANCEL"),contentId:z.string().uuid(),
    expectedUpdatedAt:time,confirm:z.literal(true),
  }).strict(),
]).superRefine((data,ctx)=>{
  if(data.action==="CANCEL")return;
  const starts=new Date(data.startsAt),ends=new Date(data.endsAt);
  // IST is UTC+05:30; the 30-minute offset preserves quarter-hour boundaries.
  for(const [key,instant] of [["startsAt",starts],["endsAt",ends]] as const){
    if(instant.getUTCMinutes()%15!==0||instant.getUTCSeconds()!==0)
      ctx.addIssue({code:"custom",path:[key],message:"Use 15-minute intervals in IST."});
  }
  if(ends<=starts)ctx.addIssue({code:"custom",path:["endsAt"],message:"End time must be after start time"});
  if(ends.getTime()-starts.getTime()>12*60*60*1000)
    ctx.addIssue({code:"custom",path:["endsAt"],message:"A live class can be at most 12 hours. Check the end date and AM/PM."});
  if(data.action==="CREATE"&&starts.getTime()<=Date.now())
    ctx.addIssue({code:"custom",path:["startsAt"],message:"Start time must be in the future."});
});
export function facultyLiveWindow(when:{startsAt:string;endsAt:string},
  period:{startDate:string;endDate:string}) {
  const start=new Date(when.startsAt),end=new Date(when.endsAt);
  // Keep period as metadata; legacy live scheduling is not restricted by
  // academic period dates, which may be unset while classes are planned.
  void period;
  return Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&end>start;
}
