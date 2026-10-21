import { z } from "zod";

export const projectMeetingPlanRowSchema = z.strictObject({
  id: z.uuid(),
  key:z.string().trim().min(1).max(120),
  meetingType:z.enum(["GENERAL","PLANNING","STANDUP","REVIEW","RETRO"]),
  meetingUrl:z.url().regex(/^https?:\/\//).nullable(),
  notes:z.string().trim().max(4000).nullable(),
  title: z.string().trim().min(1,"Title is required").max(200),
  agenda: z.string().trim().max(4000).nullable(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  linkedSprintId: z.uuid().nullable(),
  linkedTaskId: z.uuid().nullable(),
});
export type ProjectMeetingPlanRow = z.infer<typeof projectMeetingPlanRowSchema>;

export const projectMeetingPlanSchema = z.strictObject({
  expectedMeetingsToken: z.string().regex(/^[a-f0-9]{64}$/),
  meetings: z.array(projectMeetingPlanRowSchema).min(1).max(500),
}).superRefine((input, ctx) => {
  const ids = new Set<string>();
  const keys=new Set<string>();
  input.meetings.forEach((meeting, index) => {
    const key=meeting.key.toLowerCase();
    if(keys.has(key))ctx.addIssue({code:"custom",
      message:"Item "+(index+1)+": Duplicate meeting key",path:["meetings",index,"key"]});
    keys.add(key);
    if (ids.has(meeting.id)) {
      ctx.addIssue({ code: "custom", message: "Duplicate meeting", path: ["meetings", index, "id"] });
    }
    ids.add(meeting.id);
    if (Date.parse(meeting.endsAt) <= Date.parse(meeting.startsAt)) {
      ctx.addIssue({ code: "custom", message: "End time must follow start", path: ["meetings", index, "endsAt"] });
    }
  });
});

export function projectMeetingPlanFieldsChanged(before: {
  title: string;meetingKey:string|null;meetingType:string;meetingUrl:string|null;
  outcome:string|null;agenda: string | null; startsAt: Date; endsAt: Date;
  linkedSprintId: string | null; linkedTaskId: string | null;
}, next: ProjectMeetingPlanRow) {
  return before.title!==next.title||
    (before.meetingKey??"")!==next.key||
    before.meetingType!==next.meetingType||
    before.meetingUrl!==next.meetingUrl||
    before.outcome!==next.notes||
    before.agenda !== next.agenda ||
    before.startsAt.getTime() !== Date.parse(next.startsAt) ||
    before.endsAt.getTime() !== Date.parse(next.endsAt) ||
    before.linkedSprintId !== next.linkedSprintId ||
    before.linkedTaskId !== next.linkedTaskId;
}

/** Imported full-section PUT: active draft rows and deleted draft rows share
 * their stable key; the latter may be revived without replacing the UUID.
 * Scheduled/completed meetings are never silently deleted by a draft editor.
 */
export const legacyMeetingSectionSaveSchema=z.strictObject({
 expectedMeetingsToken:z.string().regex(/^[a-f0-9]{64}$/),
 meetings:z.array(projectMeetingPlanRowSchema.extend({
  id:z.uuid().optional(),
 })).max(500),
}).superRefine((input,ctx)=>{
 const keys=new Set<string>(),ids=new Set<string>();
 input.meetings.forEach((row,index)=>{
  const key=row.key.toLowerCase();
  if(keys.has(key))ctx.addIssue({code:"custom",path:["meetings",index,"key"],
    message:"Item "+(index+1)+": Duplicate meeting key"});
  keys.add(key);
  if(row.id){
   if(ids.has(row.id))ctx.addIssue({code:"custom",path:["meetings",index,"id"],
    message:"Item "+(index+1)+": Duplicate meeting"});
   ids.add(row.id);
  }
 });
});
