import {describe,it,expect} from "vitest";
import {recruiterPreviousIstCalendarYear,recruiterHistoricalJoiningLabel,
 recruiterHistoricalOfferStatus} from "@/modules/placements/recruiter-historical-offers-model";
describe("Recruiter previous-year offers projection",()=>{
 it("uses India calendar boundaries across December/January and midnight",()=>{
  const last=recruiterPreviousIstCalendarYear(new Date("2025-12-31T19:00:00Z"));
  expect(last.year).toBe(2025);
  expect(last.start.toISOString()).toBe("2024-12-31T18:30:00.000Z");
  const before=recruiterPreviousIstCalendarYear(new Date("2025-12-31T18:20:00Z"));
  expect(before.year).toBe(2024);
 });
 it("does not invent joined dates, offer replies or statuses",()=>{
  expect(recruiterHistoricalJoiningLabel(null,null)).toBe("Not recorded");
  expect(recruiterHistoricalJoiningLabel("DEFERRED","2026-08-17")).toBe("Deferred to 2026-08-17");
  expect(recruiterHistoricalJoiningLabel("JOINED",null)).toBe("Joined");
  expect(recruiterHistoricalOfferStatus("DECLINED")).toBe("Declined");
  expect(recruiterHistoricalOfferStatus("INVALID")).toBe("Unavailable");
 });
});
