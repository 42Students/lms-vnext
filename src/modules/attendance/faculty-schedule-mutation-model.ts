import {z} from "zod";
const timestamp=z.iso.datetime({offset:true});
const details=z.object({
  title:z.string().trim().min(3).max(160),
  description:z.string().trim().max(1000).nullable(),
  location:z.string().trim().max(240).nullable(),
  startsAt:timestamp,endsAt:timestamp,
}).strict();
export const facultyAttendanceScheduleSchema=z.discriminatedUnion("action",[
  details.extend({action:z.literal("CREATE"),confirm:z.literal(true)}),
  details.extend({
    action:z.literal("RESCHEDULE"),sessionId:z.string().uuid(),
    expectedUpdatedAt:timestamp,confirm:z.literal(true),
  }),
]).superRefine((v,ctx)=>{
  if(new Date(v.endsAt)<=new Date(v.startsAt))
    ctx.addIssue({code:"custom",path:["endsAt"],message:"Invalid session window"});
});
export const facultyAttendanceScheduleParamsSchema=z.object({
  deliveryId:z.string().uuid(),
}).strict();
