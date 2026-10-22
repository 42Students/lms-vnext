import { z } from "zod";

/** Legacy PUT replaced up to 500 meeting rows by a stable meetingKey.
 * The DB has unique (project_id,lower(meeting_key)) and soft-deletion fields.
 * This is a side-effect-free preflight only: creating or reviving rows needs
 * ONE project-scoped transaction with a section revision/CAS, never a loop
 * of individually committing POSTs.
 */
export const legacyMeetingSyncSchema=z.strictObject({
 expectedMeetingsToken:z.string().trim().min(1).max(256),
 meetings:z.array(z.strictObject({
  key:z.string().trim().min(1).max(120),
  title:z.string().trim().min(1).max(200),
  start:z.iso.datetime({offset:true}),
  end:z.iso.datetime({offset:true}),
  agenda:z.string().trim().max(4000).nullable().optional(),
  notes:z.string().trim().max(4000).nullable().optional(),
  retrospective:z.string().trim().max(4000).nullable().optional(),
 })).max(500).superRefine((rows,ctx)=>{
  const seen=new Set<string>();
  rows.forEach((row,index)=>{
   const key=row.key.toLowerCase();
   if(seen.has(key))ctx.addIssue({code:"custom",path:[index,"key"],message:"Duplicate meeting key"});
   seen.add(key);
   if(Date.parse(row.end)<=Date.parse(row.start))
    ctx.addIssue({code:"custom",path:[index,"end"],message:"Meeting end must be after start"});
  });
 }),
});
/** Explicit crosswalk for intentional vNext retirement of legacy calendar
 * event IDs, reminder delivery state and attendees. No fake synchronization
 * status should be shown without a registered source of truth. */
export const LEGACY_PROJECT_MEETING_FIELD_MAP={
 meetingKey:"project_meetings.meeting_key",
 title:"project_meetings.title",
 start:"project_meetings.starts_at",
 end:"project_meetings.ends_at",
 agenda:"project_meetings.agenda",
 retrospective:"project_meetings.facilitation.retroDidntGoWell",
 retroDidntGoWell:"project_meetings.facilitation.retroDidntGoWell",
 notes:"project_meetings.facilitation.notes",
 followUpAt:"project_meetings.facilitation.followUpAt",
 followUpStatus:"project_meetings.facilitation.followUpStatus",
 followUpNotes:"project_meetings.facilitation.followUpNotes",
 meetingStatus:"project_meetings.status",
 meetingType:"project_meetings.meeting_type",
 meetingUrl:"project_meetings.meeting_url",
 linkedSprintLabel:"LOOKUP_BY_LINKED_SPRINT_ID",
 linkedTaskLabel:"LOOKUP_BY_LINKED_TASK_ID",
 attendees:"NOT_IMPLEMENTED",
 reminder:"NOT_IMPLEMENTED",
 calendarEventId:"NOT_IMPLEMENTED",
} as const;
