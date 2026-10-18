import {describe,expect,it} from "vitest";
import {
 mentorMeetingDisplayStatus,
} from "@/modules/projects/mentor-meeting-display-status";
import {
 maySaveMentorMeetingStatus,mentorScheduleStatusFromMeeting,
} from "@/modules/projects/mentor-meeting-status-model";

describe("PROJ-BREAK-MENTOR-MEETING-01: persisted scheduling transition integrity",()=>{
 it.each([
  [null,"DRAFT",false,true],
  [null,"SCHEDULED",false,true],
  [null,"RESCHEDULED",false,false],
  ["DRAFT","DRAFT",false,true],
  ["DRAFT","SCHEDULED",true,true],
  ["REQUESTED","SCHEDULED",false,true],
  ["REQUESTED","DRAFT",false,false],
  ["SCHEDULED","SCHEDULED",false,true],
  ["SCHEDULED","SCHEDULED",true,false],
  ["SCHEDULED","RESCHEDULED",true,true],
  ["SCHEDULED","RESCHEDULED",false,false],
  ["RESCHEDULED","RESCHEDULED",false,true],
  ["RESCHEDULED","SCHEDULED",true,false],
  ["COMPLETED","SCHEDULED",false,false],
  ["CANCELLED","DRAFT",false,false],
  ["MISSED","SCHEDULED",false,false],
 ] as const)("enforces transition %s → %s (time changed %s): %s",(
  current,next,timeChanged,allowed,
 )=>{
  expect(maySaveMentorMeetingStatus(current,next,timeChanged)).toBe(allowed);
 });
 it("maps meeting state to form selection without authorizing a forbidden state transition",()=>{
  expect(mentorScheduleStatusFromMeeting("DRAFT")).toBe("DRAFT");
  expect(mentorScheduleStatusFromMeeting("RESCHEDULED")).toBe("RESCHEDULED");
  expect(mentorScheduleStatusFromMeeting("SCHEDULED")).toBe("SCHEDULED");
  expect(mentorScheduleStatusFromMeeting("COMPLETED")).toBe("SCHEDULED");
  expect(maySaveMentorMeetingStatus("COMPLETED","SCHEDULED",false)).toBe(false);
 });
 it("marks missed immediately after the exact end instant, not the end of the local calendar day",()=>{
  const endsAt=new Date("2026-10-18T10:00:00.000Z");
  expect(mentorMeetingDisplayStatus("SCHEDULED",endsAt,new Date("2026-10-18T10:00:00.000Z")))
   .toBe("SCHEDULED");
  expect(mentorMeetingDisplayStatus("SCHEDULED",endsAt,new Date("2026-10-18T10:00:00.001Z")))
   .toBe("MISSED");
  expect(mentorMeetingDisplayStatus("RESCHEDULED",endsAt,new Date("2026-10-18T10:00:00.001Z")))
   .toBe("MISSED");
  expect(mentorMeetingDisplayStatus("COMPLETED",endsAt,new Date("2026-10-18T10:00:00.001Z")))
   .toBe("COMPLETED");
  expect(mentorMeetingDisplayStatus("CANCELLED",endsAt,new Date("2026-10-18T10:00:00.001Z")))
   .toBe("CANCELLED");
 });
 it("never mutates the persisted scheduling status when showing a missed badge",()=>{
  const persisted={status:"SCHEDULED",endsAt:new Date("2026-10-18T10:00:00.000Z")};
  const text=mentorMeetingDisplayStatus(persisted.status,persisted.endsAt,
   new Date("2026-10-18T10:01:00.000Z"));
  expect(text).toBe("MISSED");
  expect(persisted.status).toBe("SCHEDULED");
 });
});
