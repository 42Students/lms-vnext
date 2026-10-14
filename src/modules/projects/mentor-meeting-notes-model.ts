import {z} from "zod";
export const mentorMeetingNotesParamsSchema=z.object({
  projectId:z.string().uuid(),meetingId:z.string().uuid(),
}).strict();
export const mentorMeetingNotesWriteSchema=z.object({
  outcome:z.string().trim().min(1).max(4000),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  confirmed:z.literal(true),
}).strict();
/** Migrated project_meetings.outcome is the only authoritative post-meeting note. */
export function meetingNotesEditable(projectStatus:string,meetingStatus:string){
  return projectStatus!=="ARCHIVED" && meetingStatus==="COMPLETED";
}
