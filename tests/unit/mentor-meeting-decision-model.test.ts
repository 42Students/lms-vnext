import {describe,expect,it} from "vitest";
import {mentorMeetingDecisionSchema,mentorMeetingDecisionStatus}
 from "@/modules/projects/mentor-meeting-decision-model";
describe("Mentor meeting decision rules",()=>{
 it("requires confirmation and an optimistic token",()=>{
  const good={action:"COMPLETE",expectedUpdatedAt:"2026-10-14T10:00:00.123Z",confirmed:true};
  expect(mentorMeetingDecisionSchema.safeParse(good).success).toBe(true);
  expect(mentorMeetingDecisionSchema.safeParse({...good,confirmed:false}).success).toBe(false);
  expect(mentorMeetingDecisionSchema.safeParse({...good,collegeId:"foreign"}).success).toBe(false);
 });
 it("rejects illegal status transitions",()=>{
  expect(mentorMeetingDecisionStatus("COMPLETE","REQUESTED")).toBe(false);
  expect(mentorMeetingDecisionStatus("COMPLETE","SCHEDULED")).toBe(true);
  expect(mentorMeetingDecisionStatus("CANCEL","COMPLETED")).toBe(false);
 });
});
