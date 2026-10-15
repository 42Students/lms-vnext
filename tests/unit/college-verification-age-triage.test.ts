import {describe,it,expect} from "vitest";
import {matchesVerificationAgeBand} from "@/modules/verification/queue-age-band";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("College verification queue elapsed-age triage",()=>{
 const now=new Date("2026-10-15T12:00:00.000Z");
 const ago=(hours:number)=>new Date(now.getTime()-hours*3600000);
 it("partitions waiting requests into non-overlapping 48-hour and 7-day bands",()=>{
  expect(matchesVerificationAgeBand(ago(47),"SUBMITTED","WITHIN_48_HOURS",now)).toBe(true);
  expect(matchesVerificationAgeBand(ago(48),"SUBMITTED","WITHIN_48_HOURS",now)).toBe(false);
  expect(matchesVerificationAgeBand(ago(48),"SUBMITTED","TWO_TO_SEVEN_DAYS",now)).toBe(true);
  expect(matchesVerificationAgeBand(ago(168),"UPDATE_PENDING","OVER_SEVEN_DAYS",now)).toBe(true);
  expect(matchesVerificationAgeBand(ago(168),"VERIFIED","OVER_SEVEN_DAYS",now)).toBe(false);
  expect(matchesVerificationAgeBand(new Date(now.getTime()+1000),"SUBMITTED","WITHIN_48_HOURS",now)).toBe(false);
 });
 it("rejects contradictory decided tab and age-band URL/CSV",()=>{
  expect(parseCollegeVerificationPageQuery({tab:"VERIFIED",ageBand:"OVER_SEVEN_DAYS"}).success).toBe(false);
  expect(()=>parseVerificationExportQuery(new URLSearchParams("tab=SENT_BACK&ageBand=WITHIN_48_HOURS"))).toThrow();
 });
});
