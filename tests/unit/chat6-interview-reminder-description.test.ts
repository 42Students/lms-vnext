import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {collegeInterviewActionSchema} from "@/modules/placements/college-interview-action-model";

const applicationId="60000000-0000-4000-8000-000000000001";
const roundId="60000000-0000-4000-8000-000000000002";
const appointment={
 roundId,applicationId,scheduledAt:"2026-12-02T10:00:00+05:30",
 durationMinutes:60,interviewType:"TECHNICAL" as const,
 roundDescription:"Technical round with problem solving",
 mode:"ON_CAMPUS" as const,venue:"Block A",meetingUrl:null,interviewer:null,
};

describe("legacy interview type, description and reminder parity",()=>{
 it("requires a valid type and nonblank description of at least ten characters on new bookings",()=>{
  expect(collegeInterviewActionSchema.safeParse({
   action:"SCHEDULE",confirmed:true,appointment,
  }).success).toBe(true);
  for(const invalid of [
   {...appointment,interviewType:undefined},
   {...appointment,interviewType:"UNRECOGNIZED"},
   {...appointment,roundDescription:"   "},
   {...appointment,roundDescription:"Short"},
   {...appointment,roundDescription:"x".repeat(501)},
  ]){
   expect(collegeInterviewActionSchema.safeParse({
    action:"SCHEDULE",confirmed:true,appointment:invalid,
   }).success).toBe(false);
  }
 });
 it("saves type and description on the booking and passes the saved description to the reminder",()=>{
  const writer=readFileSync("src/modules/placements/college-round-slot-action-service.ts","utf8");
  const reminder=readFileSync("src/modules/announcements/tpo-interview-reminder-email-service.ts","utf8");
  expect(writer).toContain("legacyInterviewType:a.interviewType??null");
  expect(writer).toContain("legacyRoundDescription:a.roundDescription??null");
  expect(reminder).toContain("s.legacy_round_description as round_description");
  expect(reminder).toContain("row.round_description?.trim()||row.round_name");
 });
});
