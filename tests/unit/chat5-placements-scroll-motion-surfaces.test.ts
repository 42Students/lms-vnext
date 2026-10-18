import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const load=(name:string)=>readFileSync("src/components/placements/"+name,"utf8");
describe("chat-5 placements scroll and motion surface contracts",()=>{
 it.each([
  ["02","tpo-bulk-round-result-recorder.tsx",1],
  ["03","tpo-general-requests-panel.tsx",1],
  ["04","tpo-offer-lifecycle-panel.tsx",1],
  ["05","tpo-request-bulk-decision.tsx",2],
  ["06","tpo-round-drive-day-read-only.tsx",1],
  ["07","tpo-week-hour-calendar.tsx",1],
  ["08","tpo-round-results-import.tsx",3],
  ["09","tpo-selection-import.tsx",2],
  ["10","placement-bulk-offer-withdraw.tsx",1],
  ["11","placement-drive-day-overview.tsx",1],
 ] as const)("UX-placements-scroll-motion-%s cues every newly audited scroll container in %s",(_,file,count)=>{
  const source=load(file);
  if (file === "tpo-round-drive-day-read-only.tsx" || file === "placement-drive-day-overview.tsx") {
    // The rosters use the shared responsive DataTable, whose ScrollCue owns
    // overflow detection, accessible keyboard focus and edge gradients.
    expect(source).toMatch(/import\s*\{\s*DataTable\s*\}/);
    expect(source).toContain("<DataTable");
    expect(source).toContain("getRowKey=");
    expect(source).toContain("caption=");
    expect(source).toContain("mobilePriority:");
    const table = readFileSync("src/components/ui/data-table.tsx", "utf8");
    const cue = readFileSync("src/components/ui/scroll-cue.tsx", "utf8");
    expect(table).toContain('<ScrollCue axis="x"');
    expect(table).toContain('scope="col"');
    expect(table).toContain('sm:first:sticky');
    expect(table).toContain('sm:first:left-0');
    expect(cue).toContain('role={edges.scrollable ? "region" : undefined}');
    expect(cue).toContain('tabIndex={edges.scrollable ? 0 : -1}');
    expect(cue).toContain('overflow-x-auto overscroll-x-contain');
    expect(cue).toContain('data-scroll-fade="start"');
    expect(cue).toContain('data-scroll-fade="end"');
    return;
  }
  expect(source.split("mask-image:").length-1).toBeGreaterThanOrEqual(count);
  expect(source.split("tabIndex={0}").length-1).toBeGreaterThanOrEqual(count);
  const overscroll=(source.match(/overscroll-(?:x-)?contain/g)??[]).length;
  expect(overscroll).toBeGreaterThanOrEqual(count);
  const named=(source.match(/aria-label="[^"]+, scroll (?:horizontally )?for more[^"]*"/g)??[]).length;
  expect(named).toBeGreaterThanOrEqual(count);
  // The feature uses CSS edge masks only, never an arbitrary JS scroll/transition timer.
  const scrollLines=source.split("\n").filter(line=>line.includes("mask-image:"));
  expect(scrollLines.every(line=>line.includes("overflow-")&&line.includes("overscroll-"))).toBe(true);
 });
 it("UX-placements-scroll-motion-06 preserves semantic drive-day table headers and keyboard horizontal access",()=>{
  const page=load("tpo-round-drive-day-read-only.tsx");
  const table=readFileSync("src/components/ui/data-table.tsx","utf8");
  const cue=readFileSync("src/components/ui/scroll-cue.tsx","utf8");
  expect(page).toContain('caption="Applicants in this round"');
  expect(page).toContain('key:"student",header:"Student"');
  expect(page).toContain('key:"roll",header:"Roll number"');
  expect(page).toContain('getRowKey={student=>student.applicationId}');
  expect(table).toContain('<table');
  expect(table).toContain('scope="col"');
  expect(table).toContain('caption+" scrollable columns"');
  expect(cue).toContain('aria-label={edges.scrollable ? label : undefined}');
  expect(cue).toContain('tabIndex={edges.scrollable ? 0 : -1}');
 });
 it("UX-placements-scroll-motion-07 retains a sticky IST time gutter in a horizontal calendar",()=>{
  const calendar=load("tpo-week-hour-calendar.tsx");
  expect(calendar).toContain("Recruiter follow-up weekly calendar, scroll horizontally for more days");
  expect(calendar).toContain("sticky left-0 z-10");
  expect(calendar).toContain("overscroll-x-contain");
 });
 it("UX-placements-scroll-motion-11 retains candidate as a sticky, labeled row identifier",()=>{
  const overview=load("placement-drive-day-overview.tsx");
  const table=readFileSync("src/components/ui/data-table.tsx","utf8");
  expect(overview).toContain('caption={"Round "+round.sequence+" candidate progress"}');
  expect(overview).toContain('{key:"candidate",header:"Candidate",mobilePriority:"primary"');
  expect(overview).toContain('getRowKey={participant=>participant.applicationId}');
  expect(table).toContain('sm:first:sticky');
  expect(table).toContain('sm:first:left-0');
  expect(table).toContain('sm:first:bg-surface');
  expect(table).toContain('scope="col"');
 });
 it("UX-placements-scroll-motion-09 keeps import preview separate from release confirmation",()=>{
  const selection=load("tpo-selection-import.tsx");
  expect(selection).toContain("Selection import preview, scroll for more");
  expect(selection).toContain("Unmatched selection import rows, scroll for more");
  expect(selection).toContain("<ConfirmDialog");
  expect(selection).toContain("onConfirm={()=>void confirm()}");
 });
});
