import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoBranchChartPercent} from "@/modules/placements/tpo-branch-report-view-model";

describe("TPO by-branch prototype chart",()=>{
 it("uses an absolute 0–100 percent scale",()=>{
  expect(tpoBranchChartPercent(17,96,18)).toBe(18);
  expect(tpoBranchChartPercent(2,38,5)).toBe(5);
  expect(tpoBranchChartPercent(0,38,0)).toBe(0);
  expect(tpoBranchChartPercent(96,96,100)).toBe(100);
 });
 it("never displays missing or impossible denominators as a zero percent outcome",()=>{
  expect(tpoBranchChartPercent(0,0,null)).toBeNull();
  expect(tpoBranchChartPercent(5,0,100)).toBeNull();
  expect(tpoBranchChartPercent(10,5,200)).toBeNull();
  expect(tpoBranchChartPercent(1,20,Number.NaN)).toBeNull();
  expect(tpoBranchChartPercent(-1,20,0)).toBeNull();
 });
 it("uses scoped report facts and accessible fixed rails",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/reports/by-branch/page.tsx","utf8");
  const chart=readFileSync("src/components/tpo/tpo-by-branch-prototype-chart.tsx","utf8");
  expect(page).toContain("<TpoByBranchPrototypeChart rows={workspace.report.byBranch}/>");
  expect(chart).toContain('aria-valuemax={percent===null?undefined:100}');
  expect(chart).toContain('style={{width:percent+"%"}}');
  expect(chart).toContain("Rates are measured against registered learners.");
 });
});
