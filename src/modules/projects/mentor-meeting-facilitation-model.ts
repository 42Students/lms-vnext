import {z} from "zod";

/** MEN-projects-meetings-27: structured notes are scoped to a single meeting. */
export const mentorMeetingFacilitationSchema=z.object({
 notes:z.string().trim().max(4000).default(""),
 actionItems:z.string().trim().max(4000).default(""),
 wentWell:z.string().trim().max(4000).default(""),
 improve:z.string().trim().max(4000).default(""),
 nextTime:z.string().trim().max(4000).default(""),
 followUpAt:z.iso.datetime({offset:true}).nullable().default(null),
 followUpStatus:z.enum(["NOT_PLANNED","OPEN","IN_PROGRESS","DONE","BLOCKED"]).default("NOT_PLANNED"),
 followUpNotes:z.string().trim().max(4000).default(""),
}).strict();
export type MentorMeetingFacilitation=z.infer<typeof mentorMeetingFacilitationSchema>;
export const emptyMentorMeetingFacilitation:MentorMeetingFacilitation={
 notes:"",actionItems:"",wentWell:"",improve:"",nextTime:"",
 followUpAt:null,followUpStatus:"NOT_PLANNED",followUpNotes:"",
};
