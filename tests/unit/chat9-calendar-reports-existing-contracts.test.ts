import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {positionWeekEvents} from "../../src/modules/placements/tpo-week-grid-model";
import {countsAsPlacedByCollegeRule} from "../../src/modules/placements/report-model";
const load=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("TPO calendar and reports verified source contracts",()=>{
 it("TPO-calendar-reports-03 positions overlapping rounds side by side in a 7am–9pm time grid",()=>{
  const events=["one","two"].map((id)=>({id,title:id,companyName:"Company",kind:"ROUND" as const,roundKind:"INTERVIEW",status:"SCHEDULED",jobId:null,roundId:null,followupId:null,startsAt:"2099-05-01T10:30:00+05:30",endsAt:"2099-05-01T11:30:00+05:30",href:null}));const shown=positionWeekEvents(events);expect(shown.map(e=>e.columns)).toEqual([2,2]);expect(new Set(shown.map(e=>e.column)).size).toBe(2);
 });
 it("TPO-calendar-reports-04 opens a prefilled-hour modal from the week calendar grid",()=>{
  const source=load("src/components/placements/tpo-week-hour-calendar.tsx");expect(source).toContain('aria-label={"Add follow-up on "');expect(source).toContain('<Dialog open={Boolean(slot)}');expect(source).toContain('setSlot(selected)');
 });
 it("TPO-calendar-reports-07 supports explicit drag and drop rescheduling of follow-ups",()=>{
  const source=load("src/components/placements/tpo-week-hour-calendar.tsx");expect(source).toContain("onDrop={event=>");expect(source).toContain("onDragStart={dragEvent=>");expect(source).toContain("draggable={canCreate");
 });
 it("TPO-calendar-reports-09 shows today and next seven days including a true empty state",()=>{
  const source=load("src/components/placements/placement-calendar-workspace.tsx");expect(source).toContain('aria-label="Today and next 7 days"');expect(source).toContain("Nothing scheduled today");expect(source).toContain("Next 7 days");
 });
 it("TPO-calendar-reports-12 provides Show everything while calendar filters are active",()=>{
  const source=load("src/components/placements/placement-calendar-workspace.tsx");expect(source).toContain(">Show everything</Link>");expect(source).toContain('href={calendarHref(basePath,audience,state,{company:"",kind:undefined,kinds:[],focus:null})}');
 });
 it("TPO-calendar-reports-39 renders the placement journey linking students, placements and offers",()=>{
  const source=load("src/app/(authenticated)/tpo/reports/page.tsx");expect(source).toContain('aria-label="Placement journey"');expect(source).toContain("Looking for a job");expect(source).toContain("Placed");expect(source).toContain("Accepted");
 });
 it("TPO-calendar-reports-40 renders evidence-backed chart panels on the major report views",()=>{
  const branch=load("src/app/(authenticated)/tpo/reports/by-branch/page.tsx");const status=load("src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx");expect(branch).toContain("<TpoByBranchPrototypeChart rows={workspace.report.byBranch}");
  const chart=load("src/components/tpo/tpo-by-branch-prototype-chart.tsx");
  expect(chart).toContain('aria-label="Placement rate by branch"');
  expect(chart).toContain("tpoBranchChartPercent(row.placed,row.registered,row.placementRatePercent)");
  expect(status).toContain("Acceptance rate by company");expect(status).toContain("<ReportBarChart");
 });
 it("TPO-calendar-reports-41 connects search sort columns and safe shown-row CSV to report tables",()=>{
  const table=load("src/components/placements/report-interactive-table.tsx");const adapter=load("src/components/placements/placement-report-ui.tsx");expect(table).toContain("const [columnFilters");expect(table).toContain("Search table");expect(table).toContain("Copy shown");expect(table).toContain("Export shown CSV");expect(adapter).toContain("<ReportInteractiveTable");
 });
 it("TPO-calendar-reports-42 shows live scope counts beside report navigation",()=>{
  const common=load("src/components/placements/placement-report-ui.tsx");const ctc=load("src/app/(authenticated)/tpo/reports/ctc/page.tsx");expect(common).toContain("For the filters below:");expect(common).toContain("students placed");expect(ctc).toContain("<ReportNavigation");
 });
 it("TPO-calendar-reports-47 calculates and labels answered-offer acceptance rate per company",()=>{
  const source=load("src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx");expect(source).toContain("Acceptance rate by company");expect(source).toContain("accepted / (accepted + declined + expired outstanding)");expect(source).toContain("const resolved=accepted+declined+expired;");expect(source).toContain('"Acceptance rate"');
 });
 it("TPO-calendar-reports-50 saves at most twelve report-specific named filter presets",()=>{
  const source=load("src/components/placements/tpo-report-saved-filters.tsx");expect(source).toContain("views.length>=12");expect(source).toContain('Saved filters (');expect(source).toContain("localStorage.setItem");expect(source).toContain("Delete");
 });
 it("TPO-calendar-reports-51 offers the fullscreen presentation toggle",()=>{
  const source=load("src/components/placements/tpo-report-presentation.tsx");expect(source).toContain("document.fullscreenElement");expect(source).toContain("Presentation view");expect(source).toContain(":fullscreen");
 });
 it("TPO-calendar-reports-54 separates best learner package metrics from offer-count distributions",()=>{
  const source=load("src/app/(authenticated)/tpo/reports/ctc/page.tsx");expect(source).toContain("Highest (best student offer)");expect(source).toContain("Median (best student offer)");expect(source).toContain("Accepted full-time offers by annual package band");
 });
 it("TPO-calendar-reports-56 honors released and accepted placement rules without double counting",()=>{
  expect(countsAsPlacedByCollegeRule({employmentType:"FULL_TIME",countsAsPlaced:true,offerStatus:"ISSUED",releasedAt:new Date("2026-10-15T10:00:00Z"),countsAsPlacedAt:"OFFER_RELEASED"})).toBe(true);expect(countsAsPlacedByCollegeRule({employmentType:"FULL_TIME",countsAsPlaced:true,offerStatus:"ISSUED",countsAsPlacedAt:"OFFER_ACCEPTED"})).toBe(false);expect(load("src/components/placements/placement-report-ui.tsx")).toContain("placement rule (selected, released or accepted)");
 });
 it("TPO-calendar-reports-58 links the recruiter engagement report to Engage and company memory",()=>{
  const source=load("src/app/(authenticated)/tpo/reports/leads/page.tsx");expect(source).toContain('href="/tpo/recruiters"');expect(source).toContain("Open Engage");expect(source).toContain('href="/tpo/companies"');
 });
 it("TPO-calendar-reports-R05 disables student export until a batch with real rows is selected",()=>{
  const source=load("src/app/(authenticated)/tpo/reports/accreditation/page.tsx");expect(source).toContain("selectedBatch&&studentReport&&studentReport.rows.length>0?");expect(source).toContain('aria-disabled="true"');expect(source).toContain("Preview limited to 50 rows");
 });
 it("TPO-calendar-reports-R08 pages TPO round choices rather than truncating an unsearchable list",()=>{
  const service=load("src/modules/placements/tpo-round-calendar-service.ts");const page=load("src/app/(authenticated)/tpo/calendar/rounds/page.tsx");expect(service).toContain(".limit(201).offset((input.page-1)*200)");expect(page).toContain("Next 200");expect(page).toContain("Find rounds");
 });
});
