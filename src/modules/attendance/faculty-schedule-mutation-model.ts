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
  const durationMs=Date.parse(v.endsAt)-Date.parse(v.startsAt);
  if(durationMs<=0)
    ctx.addIssue({code:"custom",path:["endsAt"],message:"Invalid session window"});
  else if(durationMs>12*60*60*1000)
    ctx.addIssue({code:"custom",path:["endsAt"],message:"A class cannot last longer than 12 hours"});
});
export const facultyAttendanceScheduleParamsSchema=z.object({
  deliveryId:z.string().uuid(),
}).strict();

/** Canonical metadata/instant equality prevents needless versions and audits. */
export function facultyScheduleFieldsChanged(current: {
  title:string;description:string|null;location:string|null;startsAt:Date;endsAt:Date;
}, next: {title:string;description:string|null;location:string|null;startsAt:string;endsAt:string}) {
  const optional = (value:string|null) => value?.trim() || null;
  return current.title.trim() !== next.title.trim() ||
    optional(current.description) !== optional(next.description) ||
    optional(current.location) !== optional(next.location) ||
    current.startsAt.getTime() !== new Date(next.startsAt).getTime() ||
    current.endsAt.getTime() !== new Date(next.endsAt).getTime();
}
export function facultyScheduleErrorMessage(raw: unknown) {
  const parsed = z.object({error:z.string().max(120)}).strict().safeParse(raw);
  if (parsed.success && parsed.data.error === "FACULTY_ATTENDANCE_SCHEDULE_STALE_VERSION")
    return "This session changed in another tab. Refresh the Section before rescheduling.";
  if (parsed.success && parsed.data.error === "FACULTY_ATTENDANCE_SCHEDULE_NO_CHANGE")
    return "No schedule details changed; nothing was saved.";
  return "Session was not saved. Check the current schedule, Section ownership and version.";
}
