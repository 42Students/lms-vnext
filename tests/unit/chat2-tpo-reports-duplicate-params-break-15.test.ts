import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";

const routes=[
 "by-branch","by-company","ctc","failure-reasons","intelligence",
 "joining-followups","joining-status","leads","offers-acceptance",
 "offers-expiry","placed-branch","placement-summary","season-pipeline","unplaced",
] as const;

describe("UX-tpo-LAST-THIRD-01: reports refuse ambiguous scope/filters without inventing zeros",()=>{
 it("treats every duplicated report selector as ambiguous without mutating caller input",()=>{
  const originals=[
   {seasonId:["one","two"]},{jobId:["drive-one","drive-two"]},
   {page:["1","2"]},{outcome:["PASS","FAIL"]},{branchId:["first","second"]},
   {batchId:["first","second"]},{q:["Ada","Bob"]},{sort:["ASC","DESC"]},
  ];
  for(const params of originals){
   const original=JSON.stringify(params);
   expect(tpoReportHasAmbiguousFilters(params)).toBe(true);
   expect(JSON.stringify(params)).toBe(original);
  }
  expect(tpoReportHasAmbiguousFilters({seasonId:"one",jobId:"two",page:"1"})).toBe(false);
  expect(tpoReportHasAmbiguousFilters({})).toBe(false);
 });
 it.each(routes)("rejects duplicated %s filters before reading any scoped report",route=>{
  const source=readFileSync(`src/app/(authenticated)/tpo/reports/${route}/page.tsx`,"utf8");
  expect(source).toContain("getCurrentRequestContext");
  expect(source).toContain("tpoReportHasAmbiguousFilters(");
  expect(source).toContain(`<TpoReportInvalidFilters path="/tpo/reports/${route}"/>`);
  expect(source).toContain('import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters"');
  const check=source.indexOf("if(tpoReportHasAmbiguousFilters(");
  const lastAwait=source.lastIndexOf("= await searchParams;",check);
  expect(lastAwait,route).toBeGreaterThan(-1);
  expect(check,route).toBeGreaterThan(lastAwait);
  expect(source,route).not.toContain("dangerouslySetInnerHTML");
 });
 it("renders an honest 14-route recovery state without a fictitious placement count",()=>{
  const source=readFileSync("src/components/placements/tpo-report-invalid-filters.tsx","utf8");
  expect(source).toContain('role="alert"');
  expect(source).toContain("No report records were loaded");
  expect(source).toContain("Clear filters");
  expect(source).not.toMatch(/0 placed|0%|No students placed/);
 });
});
