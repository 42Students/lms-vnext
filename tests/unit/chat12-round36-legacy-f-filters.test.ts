import {describe,it,expect} from "vitest";
import {normalizeTpoStudentLegacyFilters} from "@/modules/placements/tpo-students-filter-aliases";
import {tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO Students historical grid filters",()=>{
 it("TPO-students-24 normalizes valid legacy f_<key> links without admitting duplicate or unknown selectors",()=>{
  expect(normalizeTpoStudentLegacyFilters({f_minCgpa:"7.5",f_hasResume:"YES"})).toEqual({minCgpa:"7.5",hasResume:"YES"});
  expect(tpoStudentUrlError({f_minCgpa:"7.5"})).toBeNull();
  expect(tpoStudentUrlError({f_minCgpa:"7.5",minCgpa:"9"})).not.toBeNull();
  expect(tpoStudentUrlError({f_fake:"7"})).not.toBeNull();
  expect(source("src/app/(authenticated)/tpo/students/page.tsx")).toContain("normalizeTpoStudentLegacyFilters(incoming)");
 });
 it("TPO-students-24 retains active filter chips and Clear all with live server match counts",()=>{
  const panel=source("src/components/tpo/tpo-grid-filter-panel.tsx");
  expect(panel).toContain('aria-label="Active grid filters"');
  expect(panel).toContain("activeCount} active");
  expect(panel).toContain(">Clear all</Button>");
  expect(panel).toContain("clearTpoGridFilters(new URLSearchParams(query.toString()),fields)");
  expect(source("src/app/(authenticated)/tpo/students/page.tsx")).toContain("students in this view");
 });
});
