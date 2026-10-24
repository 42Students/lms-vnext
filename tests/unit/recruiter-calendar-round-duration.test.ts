import {describe,expect,it} from "vitest";
import {recruiterRoundEndTime} from "@/modules/placements/recruiter-calendar-model";
describe("REC-calendar-messages-profile-03 recorded round duration",()=>{
 const start=new Date("2026-10-17T03:30:00Z"); // 9 AM IST
 it("derives a true end instant from a persisted duration",()=>{
  expect(recruiterRoundEndTime(start,90)?.toISOString()).toBe("2026-10-17T05:00:00.000Z");
  expect(start.toISOString()).toBe("2026-10-17T03:30:00.000Z");
 });
 it("does not invent an end for unknown or malformed durations",()=>{
  expect(recruiterRoundEndTime(start,null)).toBeNull();
  expect(recruiterRoundEndTime(start,0)).toBeNull();
  expect(recruiterRoundEndTime(start,-3)).toBeNull();
  expect(recruiterRoundEndTime(start,2.5)).toBeNull();
  expect(recruiterRoundEndTime(null,90)).toBeNull();
 });
});
