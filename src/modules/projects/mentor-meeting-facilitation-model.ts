import {z} from "zod";

/** MEN-projects-meetings-27: structured notes are scoped to a single meeting. */
/** Structured legacy meeting facts stay in the existing JSONB facilitation
 * map; no additional table and no lossy text serialization are required.
 * The original free-text actionItems remains for backward-compatible drafts.
 */
export const meetingAttendeeSchema=z.strictObject({
 name:z.string().trim().min(1).max(160),
 membershipId:z.string().uuid().nullable().default(null),
 attended:z.boolean().default(true),
});
export const meetingActionRowSchema=z.strictObject({
 text:z.string().trim().min(1).max(500),
 owner:z.string().trim().max(160).nullable().default(null),
 dueAt:z.iso.datetime({offset:true}).nullable().default(null),
 complete:z.boolean().default(false),
});
/** A retrospective action can be promoted to an existing vNext task.
 * The legacy taskKey is retained as data, not coerced to a membership/UUID.
 * A later task promotion links by the new UUID without losing original text. */
export const meetingRetroActionSchema=meetingActionRowSchema.extend({
 taskKey:z.string().trim().min(1).max(120).nullable().optional(),
 linkedTaskId:z.string().uuid().nullable().optional(),
});
export const mentorMeetingFacilitationSchema=z.object({
 attendees:z.array(meetingAttendeeSchema).max(100).default([]),
 actionItemRows:z.array(meetingActionRowSchema).max(100).default([]),
 retroActions:z.array(meetingRetroActionSchema).max(100).default([]),
 notes:z.string().trim().max(4000).default(""),
 actionItems:z.string().trim().max(4000).default(""),
 wentWell:z.string().trim().max(4000).default(""),
 // Legacy retrospective column, separate from improvement ideas.
 retroDidntGoWell:z.string().trim().max(4000).default(""),
 improve:z.string().trim().max(4000).default(""),
 nextTime:z.string().trim().max(4000).default(""),
 followUpAt:z.iso.datetime({offset:true}).nullable().default(null),
 followUpStatus:z.enum(["NOT_PLANNED","OPEN","IN_PROGRESS","DONE","BLOCKED"]).default("NOT_PLANNED"),
 followUpNotes:z.string().trim().max(4000).default(""),
}).strict();
export type MentorMeetingFacilitation=z.infer<typeof mentorMeetingFacilitationSchema>;
export const emptyMentorMeetingFacilitation:MentorMeetingFacilitation={
 attendees:[],actionItemRows:[],retroActions:[],
 notes:"",actionItems:"",wentWell:"",retroDidntGoWell:"",improve:"",nextTime:"",
 followUpAt:null,followUpStatus:"NOT_PLANNED",followUpNotes:"",
};

/** Calendar detail can update post-meeting notes without rescheduling,
 * overwriting meeting status, re-inviting attendees, or changing the outcome.
 * A stale meeting timestamp must be rejected by the service.
 */
export const mentorMeetingFacilitationWriteSchema=z.strictObject({
 facilitation:mentorMeetingFacilitationSchema,
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 confirmed:z.literal(true),
});
