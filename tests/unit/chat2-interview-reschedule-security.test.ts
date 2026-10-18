import {describe,expect,it} from "vitest";
import {
 tpoInterviewRescheduleSchema,validInterviewWindow,overlappingInterviewVenue,
} from "@/modules/placements/tpo-interview-reschedule-model";

const valid={
 confirmed:true,
 expectedUpdatedAt:"2099-07-01T05:30:00+05:30",
 localDateTime:"2099-07-03T10:00",
 mode:"VIRTUAL",
 meetingUrl:"https://meet.example.org/room",
 reason:"Candidate requested a different interview time",
} as const;

describe("TPO-drive-workspace-44 interview scheduling and rescheduling security",()=>{
 it("TPO-drive-workspace-44 accepts only secure, credential-free virtual interview links",()=>{
  expect(tpoInterviewRescheduleSchema.safeParse(valid).success).toBe(true);
  for(const meetingUrl of [
   "http://meet.example.org/room",
   "https://user:password@meet.example.org/room",
   "https://user@meet.example.org/room",
   "javascript:alert(1)",
   "//meet.example.org/room",
   "not-a-url",
  ])expect(tpoInterviewRescheduleSchema.safeParse({...valid,meetingUrl}).success,meetingUrl).toBe(false);
 });
 it("TPO-drive-workspace-44 rejects forged/partial reschedules and requires an on-campus venue",()=>{
  expect(tpoInterviewRescheduleSchema.safeParse({
   ...valid,mode:"ON_CAMPUS",meetingUrl:undefined,venue:"Interview Hall A",
  }).success).toBe(true);
  for(const input of [
   {...valid,confirmed:false},
   {...valid,expectedUpdatedAt:"not-a-token"},
   {...valid,localDateTime:"2099-07-03T10:00:00"},
   {...valid,mode:"ON_CAMPUS",venue:undefined},
   {...valid,reason:"too short"},
   {...valid,adminScope:"foreign-college"},
  ])expect(tpoInterviewRescheduleSchema.safeParse(input).success,JSON.stringify(input)).toBe(false);
 });
 it("TPO-drive-workspace-44 refuses invalid, noninteger, or implausibly long windows",()=>{
  const now=new Date("2099-07-03T08:00:00.000Z");
  const after=new Date("2099-07-03T09:00:00.000Z");
  const before=new Date("2099-07-03T07:00:00.000Z");
  expect(validInterviewWindow(after,now,60)).toBe(true);
  expect(validInterviewWindow(after,now,null)).toBe(true);
  expect(validInterviewWindow(before,now,60)).toBe(false);
  expect(validInterviewWindow(new Date("invalid"),now,60)).toBe(false);
  for(const duration of [0,-1,1.5,Number.NaN,Infinity,1441])
   expect(validInterviewWindow(after,now,duration),String(duration)).toBe(false);
 });
 it("TPO-drive-workspace-44 detects venue overlaps, but not precisely touching windows",()=>{
  const start=new Date("2099-07-03T09:00:00.000Z");
  const previous=new Date("2099-07-03T08:00:00.000Z");
  const justBefore=new Date("2099-07-03T09:30:00.000Z");
  const overlapping=new Date("2099-07-03T09:15:00.000Z");
  expect(overlappingInterviewVenue(start,30,[{start:justBefore,durationMinutes:30}])).toBe(false);
  expect(overlappingInterviewVenue(start,30,[{start:overlapping,durationMinutes:30}])).toBe(true);
  expect(overlappingInterviewVenue(start,30,[{start:previous,durationMinutes:null}])).toBe(true);
  expect(overlappingInterviewVenue(new Date("invalid"),30,[])).toBe(true);
  expect(overlappingInterviewVenue(start,Number.NaN,[])).toBe(true);
 });
});
