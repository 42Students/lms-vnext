import {describe,it,expect} from "vitest";
import {matchesSubmittedFrom,verificationSubmissionWindowValid} from "@/modules/verification/queue-waiting-since";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
describe("College verification IST submission lower bound",()=>{
 it("uses the beginning of the requested IST day inclusively",()=>{
  expect(matchesSubmittedFrom(new Date("2026-10-14T18:29:59.999Z"),"2026-10-15")).toBe(false);
  expect(matchesSubmittedFrom(new Date("2026-10-14T18:30:00.000Z"),"2026-10-15")).toBe(true);
  expect(matchesSubmittedFrom(new Date("2026-10-15T18:29:59Z"),"2026-10-15")).toBe(true);
  expect(matchesSubmittedFrom(new Date(0),undefined)).toBe(true);
 });
 it("rejects impossible or reversed day windows before a protected read",()=>{
  expect(()=>matchesSubmittedFrom(new Date(),"2026-02-30")).toThrow("INVALID_SUBMITTED_FROM");
  expect(verificationSubmissionWindowValid({submittedFrom:"2026-10-16",waitingSince:"2026-10-15"})).toBe(false);
  expect(parseCollegeVerificationPageQuery({submittedFrom:"2026-10-16",waitingSince:"2026-10-15"}).success).toBe(false);
  expect(parseCollegeVerificationPageQuery({submittedFrom:"2026-10-15"}).success).toBe(true);
 });
});
