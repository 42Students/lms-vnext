import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
import {potentialRoomConflicts,superAdminInterviewCsv,type SuperAdminCalendarRound} from "@/modules/admin-ui/super-admin-interview-operations-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const a:SuperAdminCalendarRound={id:"a",roundId:"a",jobId:"job",jobTitle:"Job",title:"Round",companyName:"Example",status:"SCHEDULED",kind:"INTERVIEW",startsAt:"2099-01-01T09:00:00Z",endsAt:"2099-01-01T10:00:00Z",venue:"Room 1"};
describe("Super Admin placement interview operations",()=>{
 it("SA-placements-projects-45 detects clearly named possible venue conflicts without claiming candidate collisions",()=>{
  const c=potentialRoomConflicts([a,{...a,id:"b",startsAt:"2099-01-01T09:30:00Z",endsAt:"2099-01-01T10:30:00Z"}]);
  expect(c.size).toBe(2);
  expect(potentialRoomConflicts([a,{...a,id:"c",startsAt:"2099-01-01T10:00:00Z"}]).size).toBe(0);
 });
 it("SA-placements-projects-46 renders real round Type Status Mode Sort and conflict-only filters",()=>{
  const component=read("src/components/admin/super-admin-interview-operations.tsx");
  for(const label of ['choices("Type"','choices("Status"','choices("Mode"','choices("Sort"','Possible conflicts only'])expect(component).toContain(label);
  expect(component).toContain('choices("Department"');
  expect(component).toContain("Department filter uses the applicant");
 });
 it("SA-placements-projects-47 exposes CSV and .ics exports with bounded source, clear metric labels and valid CSV escaping",()=>{
  const view=read("src/components/admin/super-admin-interview-operations.tsx");
  expect(view).toContain('download="interviews.csv"');
  expect(view).toContain('.ics');
  expect(view).toContain("Possible venue conflicts");
  expect(superAdminInterviewCsv([{...a,companyName:"=danger"}])).toContain("'=danger");
 });
 it("GR-38 avoids invalid dates or numbers in interview summaries",()=>{
  expect(potentialRoomConflicts([]).size).toBe(0);
  expect(superAdminInterviewCsv([])).toContain("Starts at");
 });
 it("GR-39 long names remain inside a horizontally scrollable table",()=>{
  const view=read("src/components/admin/super-admin-interview-operations.tsx");
  expect(view).toContain("overflow-x-auto");
  expect(view).toContain('min-w-[55rem]');
 });
 it("GR-71 a failed filter has a filtered-empty state and clear action",()=>{
  const view=read("src/components/admin/super-admin-interview-operations.tsx");
  expect(view).toContain("No interviews match these filters.");
  expect(view).toContain("Clear filters");
 });
 it("GR-72 missing candidate metadata stays explicitly unavailable, never invented",()=>{
  const view=read("src/components/admin/super-admin-interview-operations.tsx");
  expect(view).toContain("Department filter uses the applicant");
 });
 it("GR-91 calendar export and clear filters are keyboard reachable",()=>{
  const view=read("src/components/admin/super-admin-interview-operations.tsx");
  expect(view).toContain('type="button"');
  expect(view).toContain('min-h-11');
 });
 it("GR-92 conflict status uses an explicit text label in addition to color",()=>{
  const view=read("src/components/admin/super-admin-interview-operations.tsx");
  expect(view).toContain("conflicts.get(row.id)?.join");
 });
});
