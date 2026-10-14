import {describe,expect,it} from "vitest";
import {meetingNotesEditable,mentorMeetingNotesParamsSchema,mentorMeetingNotesWriteSchema}
  from "@/modules/projects/mentor-meeting-notes-model";
describe("Persisted Mentor meeting outcomes",()=>{
  it("permits only completed non-archived meeting notes",()=>{
    expect(meetingNotesEditable("ACTIVE","COMPLETED")).toBe(true);
    expect(meetingNotesEditable("ARCHIVED","COMPLETED")).toBe(false);
    expect(meetingNotesEditable("ACTIVE","REQUESTED")).toBe(false);
    expect(meetingNotesEditable("ACTIVE","SCHEDULED")).toBe(false);
    expect(meetingNotesEditable("ACTIVE","CANCELLED")).toBe(false);
  });
  it("rejects empty notes, forged actor, missing confirmation and invalid path",()=>{
    const input={outcome:"Notes",expectedUpdatedAt:"2026-10-14T10:00:00.000Z",confirmed:true};
    expect(mentorMeetingNotesWriteSchema.safeParse(input).success).toBe(true);
    expect(mentorMeetingNotesWriteSchema.safeParse({...input,confirmed:false}).success).toBe(false);
    expect(mentorMeetingNotesWriteSchema.safeParse({...input,outcome:"  "}).success).toBe(false);
    expect(mentorMeetingNotesWriteSchema.safeParse({...input,actorId:"forged"}).success).toBe(false);
    expect(mentorMeetingNotesParamsSchema.safeParse({projectId:"bad",meetingId:"bad"}).success).toBe(false);
  });
});
