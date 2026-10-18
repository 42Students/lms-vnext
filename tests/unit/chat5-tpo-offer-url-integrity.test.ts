import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoReportHasAmbiguousFilters,tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {offerRegisterQuery} from "@/modules/placements/tpo-drive-offer-register-model";

const code=(file:string)=>readFileSync(file,"utf8");
const page="src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx";
const exportRoute="src/app/api/placements/tpo/jobs/[jobId]/offers/export/route.ts";

describe("TPO offer register screen/export URL integrity",()=>{
 it("TPO-OFFERS-URL-32 refuses every repeated filter rather than silently picking its first value",()=>{
  for(const key of ["status","page","q","joining","kind","expiry","minCtcLpa","maxCtcLpa"]){
   expect(tpoReportHasAmbiguousFilters({[key]:["ALL","ISSUED"]})).toBe(true);
  }
  expect(tpoReportHasAmbiguousFilters({status:"ALL",q:"learner"})).toBe(false);
  const ui=code(page);
  expect(ui).toContain("tpoReportHasAmbiguousFilters(q)");
  expect(ui).toContain('Object.prototype.hasOwnProperty.call(q,"jobId")');
  expect(ui).toContain("<TpoReportInvalidFilters");
  expect(ui.indexOf("tpoReportHasAmbiguousFilters(q)")).toBeLessThan(ui.indexOf("offerRegisterQuery.safeParse("));
  expect(ui).toContain('hasMembershipRole(context,"TPO")');
  expect(ui).toContain('getTpoDriveOfferRegister(context,parsed.data)');
 });
 it("TPO-OFFERS-EXPORT-33 prevents one requested job from silently exporting a different jobId",()=>{
  for(const raw of [
   "status=ISSUED&status=ACCEPTED","q=a&q=b","minCtcLpa=1&minCtcLpa=9",
   "jobId=one&jobId=two",
  ])expect(tpoReportHasRepeatedSearchParams(new URLSearchParams(raw))).toBe(true);
  expect(tpoReportHasRepeatedSearchParams(new URLSearchParams("status=ISSUED&q=a"))).toBe(false);
  const route=code(exportRoute);
  expect(route).toContain('url.searchParams.has("jobId")');
  expect(route).toContain("tpoReportHasRepeatedSearchParams(url.searchParams)");
  expect(route).toContain('{...Object.fromEntries(url.searchParams.entries()),jobId}');
  expect(route).toContain("getTpoDriveOfferRegisterCsv");
  expect(route).toContain('"Cache-Control":"private, no-store, max-age=0"');
  expect(route).toContain('status:400');
  expect(route).toContain("Invalid report filters. Clear the filters and try again.");
  expect(route).toContain('"X-Content-Type-Options":"nosniff"');
  expect(route).not.toContain("{jobId,...Object.fromEntries");
 });
 it("TPO-CANDIDATE-SCHEDULE-34 distinguishes an unknown single round from ambiguous repeated round filters",()=>{
  expect(tpoReportHasAmbiguousFilters({roundId:["11111111-1111-4111-8111-111111111111",
   "22222222-2222-4222-8222-222222222222"]})).toBe(true);
  expect(tpoReportHasAmbiguousFilters({roundId:"11111111-1111-4111-8111-111111111111"})).toBe(false);
  const src=code("src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx");
  expect(src).toContain("tpoReportHasAmbiguousFilters(query)");
  expect(src).toContain("<TpoReportInvalidFilters");
  expect(src.indexOf("tpoReportHasAmbiguousFilters(query)")).toBeLessThan(
   src.indexOf("getTpoCandidateScheduleReadiness(context, jobId)"));
  expect(src).toContain('roundId ? readiness.displayed.filter(row => row.roundId === roundId)');
  expect(src).toContain("That round is not part of this drive.");
  expect(src).toContain("Show all rounds");
  expect(src).toContain("<DataTable");
 });
 it("TPO-OFFERS-URL-32 uses the same strict persisted filter schema as the CSV export",()=>{
  const jobId="11111111-1111-4111-8111-111111111111";
  expect(offerRegisterQuery.safeParse({jobId,status:"EXPIRED"}).success).toBe(true);
  expect(offerRegisterQuery.safeParse({jobId,status:"CANCELLED"}).success).toBe(false);
  expect(offerRegisterQuery.safeParse({jobId,page:"0"}).success).toBe(false);
  expect(offerRegisterQuery.safeParse({jobId,otherCollegeId:"22222222-2222-4222-8222-222222222222"}).success).toBe(false);
 });
});
