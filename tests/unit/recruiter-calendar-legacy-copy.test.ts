import {describe,expect,it} from "vitest";
import {hrRecruiterLegacyWeekRange,HR_RECRUITER_CALENDAR_EMPTY_TITLE,HR_RECRUITER_CALENDAR_EMPTY_HELP} from "@/modules/placements/hr-calendar-legacy-copy-model";
describe("REC-calendar-messages-profile-05 exact calendar strings",()=>{
 it("formats the legacy week range without repeating the year",()=>{
  expect(hrRecruiterLegacyWeekRange("2026-10-12","2026-10-18")).toBe("12 Oct to 18 Oct 2026");
  expect(hrRecruiterLegacyWeekRange("2026-12-28","2027-01-03")).toBe("28 Dec to 3 Jan 2027");
 });
 it("matches the exact legacy empty state",()=>{
  expect(HR_RECRUITER_CALENDAR_EMPTY_TITLE).toBe("Nothing scheduled this week");
  expect(HR_RECRUITER_CALENDAR_EMPTY_HELP).toBe("Rounds, slots and deadlines appear here as soon as they are dated.");
 });
});
