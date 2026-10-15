import {describe,it,expect} from "vitest";
import {verificationQueueFilters,verificationEnrollmentFiltersValid} from "@/modules/verification/queue-filters";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("College verification active enrollment filter",()=>{
 const programId="00000000-0000-4000-8000-000000000011";
 it("shares typed enrollment semantics across queue and CSV",()=>{
  expect(verificationQueueFilters.parse({enrollment:"NONE"}).enrollment).toBe("NONE");
  expect(parseCollegeVerificationPageQuery({enrollment:"ACTIVE"}).success).toBe(true);
  expect(parseVerificationExportQuery(new URLSearchParams({enrollment:"NONE"})).enrollment).toBe("NONE");
  expect(verificationQueueFilters.safeParse({enrollment:"UNKNOWN"}).success).toBe(false);
 });
 it("prevents a request for no enrollment and a specific active assignment",()=>{
  expect(verificationEnrollmentFiltersValid({enrollment:"NONE",programId})).toBe(false);
  expect(parseCollegeVerificationPageQuery({enrollment:"NONE",programId}).success).toBe(false);
  expect(()=>parseVerificationExportQuery(new URLSearchParams({enrollment:"NONE",programId}))).toThrow();
 });
});
