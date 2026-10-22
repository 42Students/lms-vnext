import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
import {hiringFunnel,hiringMetricLabel} from "@/modules/admin-ui/super-admin-hiring-funnel-model";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin Analytics",()=>{
 it("SA-placements-projects-41 renders headline metrics, a six-stage Hiring Funnel and conversion ratios",()=>{
  const page=source("src/app/(authenticated)/admin/placements/analytics/page.tsx");
  expect(page).toContain('aria-label="Hiring Funnel"');
  expect(page).toContain('"assessment"');
  expect(page).toContain("Avg. time to shortlist: Not recorded");
  expect(hiringMetricLabel("totalApplications")).toBe("Total Applications");
  const items=hiringFunnel({applied:100,shortlisted:80,assessment:40,interview:30,offered:10,hired:5});
  expect(items.map(x=>x.label)).toEqual(["Applied","Shortlisted","Assessment","Interview","Offered","Hired"]);
  expect(items[2].percentPrevious).toBe(50);
 });
 it("GR-38 safely calculates hiring funnel rates for empty or incomplete data",()=>{
  const results=hiringFunnel({applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0});
  expect(results.every(x=>Number.isFinite(x.widthPercent))).toBe(true);
  expect(results.every(x=>x.percentPrevious===null||Number.isFinite(x.percentPrevious))).toBe(true);
 });
 it("GR-39 renders analytics metric headings and bars in wrapping responsive containers",()=>{
  const page=source("src/app/(authenticated)/admin/placements/analytics/page.tsx");
  expect(page).toContain("min-w-0");
  expect(page).toContain("sm:grid-cols-2 lg:grid-cols-3");
  expect(page).toContain("overflow-hidden");
 });
 it("GR-71 displays filtered-empty reporting state and reset action",()=>{
  const page=source("src/app/(authenticated)/admin/placements/analytics/page.tsx");
  expect(page).toContain("No companies match these filters");
  expect(page).toContain("Clear all");
 });
 it("GR-73 preserves selected filters when refreshing the hiring report",()=>{
  const page=source("src/app/(authenticated)/admin/placements/analytics/page.tsx");
  expect(page).toContain("defaultValue={q.q}");
  expect(page).toContain("defaultValue={q.appliedFrom??");
 });
});
