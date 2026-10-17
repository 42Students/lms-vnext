import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const page=()=>src("src/app/(authenticated)/tpo/students/page.tsx");
const grid=()=>src("src/components/tpo/tpo-students-spreadsheet.tsx");
describe("chat-12 reopened Students URL facets and UI contracts",()=>{
 it("TPO-students-19 accepts a valid legacy journey stage and furthest-round filter",()=>{
  expect(tpoStudentUrlError({legacyStage:"VERIFIED",minRoundReached:"2"})).toBeNull();
  expect(page()).toContain('name="minRoundReached"');
 });
 it("TPO-students-22 permits profile strength filters without allowing unsupported params",()=>{
  expect(tpoStudentUrlError({gender:"Female",birthYear:"2004",minSkills:"2",minProjects:"1",minCertifications:"1",minExperiences:"0",hasProfileLinks:"YES"})).toBeNull();
  expect(tpoStudentUrlError({unapprovedFacet:"true"})).not.toBeNull();
  expect(page()).toContain('name="birthYear"');
 });
 it("TPO-students-24 preserves debarred and attention filters through URL validation",()=>{
  expect(tpoStudentUrlError({debarred:"YES",needsAttention:"YES"})).toBeNull();
  expect(grid()).toContain("<TpoGridFilterPanel fields={filters} mobileSheet/>");
 });
 it("TPO-students-25 recognizes q and student deep links, but refuses duplicate search selectors",()=>{
  const id="123e4567-e89b-42d3-a456-426614174000";
  expect(tpoStudentUrlError({q:"Learner",student:id})).toBeNull();
  expect(tpoStudentUrlError({q:"a",search:"b"})).not.toBeNull();
  expect(tpoStudentUrlError({q:["one","two"]})).not.toBeNull();
  expect(page()).toContain("first(raw.q)");
 });
 it("TPO-students-29 accepts scoped academic mark, passing year and lateral-entry controls",()=>{
  expect(tpoStudentUrlError({minTenthPct:"75",minTwelfthPct:"75",minDiplomaPct:"75",minUgPct:"75",passingYear:"2026",maxGapYears:"1",marksVerified:"YES",isLateralEntry:"NO"})).toBeNull();
  expect(grid()).toContain('{key:"ug",label:"UG %"');
 });
 it("TPO-students-31 exposes needs-attention and readiness evidence rather than inventing a preparation score",()=>{
  expect(tpoStudentUrlError({needsAttention:"YES",debarred:"NO"})).toBeNull();
  expect(grid()).toContain('{key:"readiness",label:"Readiness evidence"');
 });
 it("TPO-students-32 shows the registration-not-open warning from scoped batch invitation facts",()=>{
  expect(page()).toContain("(data.uninvitedCount??0)>0");
  expect(page()).toContain("their batch has not been invited, so they cannot register.");
  expect(page()).toContain('href="/tpo/batches"');
 });
 it("TPO-students-43 keeps contextual student needs-attention and Team shortcuts",()=>{
  const panel=src("src/components/tpo/tpo-student-quick-panel.tsx");
  expect(panel).toContain("Needs attention");
  expect(panel).toContain("Placement eligibility");
  expect(panel).toContain('/tpo/team?about=');
 });
 it("TPO-students-46 retains the legacy Students subtitle and single header import action",()=>{
  expect(page()).toContain("Everyone in placements, from the batches you made eligible.");
  expect(page()).toContain("actions={manageAllowed?<TpoAcademicImportWorkspace />:undefined}");
 });
 it("TPO-students-47 keeps the legacy no-eligible-students wording and recovery navigation",()=>{
  expect(page()).toContain("Nobody is in placements yet.");
  expect(page()).toContain("Decide who is in on Placement eligibility; they show up here.");
  expect(page()).toContain("First matching page");
 });
 it("TPO-students-48 announces count of filtered roster rows",()=>{
  expect(page()).toContain('{roster.total} students in this view');
  expect(page()).toContain('aria-live="polite"');
 });
 it("TPO-students-51 collapses mobile row actions without hiding filters",()=>{
  expect(grid()).toContain("mobileActionsCollapsible storageKey=");
  expect(src("src/components/tpo/tpo-spreadsheet-grid.tsx")).toContain("<summary");
 });
 it("TPO-students-53 distinguishes issued offers from accepted offers and pending answers",()=>{
  const model=src("src/modules/placements/tpo-students-model.ts");
  expect(model).toContain('offer.status==="ISSUED"');
  expect(grid()).toContain("Offers waiting on their answer");
 });
});
