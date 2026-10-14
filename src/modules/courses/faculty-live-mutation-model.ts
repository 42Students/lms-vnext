import { z } from "zod";

export const facultyLiveMutationParamsSchema=z.object({
  deliveryId:z.string().uuid(),
}).strict();
const httpsMeeting=z.string().url().max(1200).refine(value=>{
  try {
    const parsed=new URL(value);
    return parsed.protocol==="https:" && !!parsed.hostname &&
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
  if(data.action!=="CANCEL" && new Date(data.endsAt)<=new Date(data.startsAt))
    ctx.addIssue({code:"custom",path:["endsAt"],message:"End must follow start"});
});
export function facultyLiveWindow(when:{startsAt:string;endsAt:string},
  period:{startDate:string;endDate:string}) {
  const start=new Date(when.startsAt),end=new Date(when.endsAt);
  const lo=Date.parse(period.startDate+"T00:00:00+05:30");
  const hi=Date.parse(period.endDate+"T00:00:00+05:30")+86400000;
  return Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&
    end>start && start.getTime()>=lo && end.getTime()<=hi;
}
