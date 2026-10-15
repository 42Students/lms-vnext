import {describe,expect,it} from "vitest";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("College verification college-owned program selector",()=>{
 const programId="00000000-0000-4000-8000-000000000011";
 it("validates and preserves exact UUID programs for queue and capped CSV",()=>{
  expect(parseCollegeVerificationPageQuery({programId}).success).toBe(true);
  expect(parseVerificationExportQuery(new URLSearchParams({programId})).programId).toBe(programId);
  expect(verificationQueueFilters.safeParse({programId:"not-uuid"}).success).toBe(false);
 });
});
