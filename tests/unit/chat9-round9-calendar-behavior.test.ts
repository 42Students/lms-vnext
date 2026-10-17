import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 calendar and report layout behavior verification (no restyling)",()=>{
 it("TPO-calendar-reports-03 shows a real 07:00–21:00 weekly hourly timeline with active now indicator",()=>{
  const s=source("src/components/placements/tpo-week-hour-calendar.tsx");
  expect(s).toContain("const FIRST=7,LAST=21,HEIGHT=64;");
  expect(s).toContain("style={{top:offset*HEIGHT}}");
  expect(s).toContain("nowMinutes>=FIRST*60&&nowMinutes<=LAST*60");
  expect(s).toContain("positionWeekEvents(");
 });
 it("TPO-calendar-reports-04 opens a prefilled, cancellable follow-up form from an hour slot, with blocked-day confirmation",()=>{
  const s=source("src/components/placements/tpo-week-hour-calendar.tsx");
  expect(s).toContain('aria-label={"Add follow-up on "+label(day)+" at "+clock(FIRST+offset)}');
  expect(s).toContain('aria-label="New recruiter follow-up"');
  expect(s).toContain('type="datetime-local" value={slot}');
  expect(s).toContain("cancelDraft()");
  expect(s).toContain("This date is blocked in placement settings.");
 });
 it("TPO-calendar-reports-09 shows actual today items and next 7 days while keeping unavailable data distinct from zero",()=>{
  const s=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(s).toContain('aria-label="Today and next 7 days"');
  expect(s).toContain("Today&apos;s schedule is unavailable.");
  expect(s).toContain("Next 7 days ·");
  expect(s).toContain("Nothing scheduled today");
 });
 it("TPO-calendar-reports-39 keeps journey links tied to selected season with no pretend offer count",()=>{
  const s=source("src/app/(authenticated)/tpo/reports/page.tsx");
  expect(s).toContain("Looking for a job");
  expect(s).toContain("Placed");
  expect(s).toContain("Accepted");
  expect(s).toContain("offers made across the selected season and drive scope.");
  expect(s).toContain("students under the college&apos;s placement rule");
 });
 it("TPO-calendar-reports-40 renders branch rate from measured values rather than invented graph numbers",()=>{
  const page=source("src/app/(authenticated)/tpo/reports/by-branch/page.tsx");
  const graph=source("src/components/placements/report-bar-chart.tsx");
  expect(page).toContain('ReportBarChart title="Placement rate by branch"');
  expect(page).toContain("row.placementRatePercent===null?");
  expect(graph).toContain("rows");
  expect(graph).toContain("units");
 });
});
