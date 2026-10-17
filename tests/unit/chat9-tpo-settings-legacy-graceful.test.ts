import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {formatTpoAuditEventType} from "../../src/modules/placements/tpo-audit-model";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO Settings legacy copy and graceful editing",()=>{
 it("TPO-settings-audit-03 uses the original placement settings section names",()=>{
  const value=source("src/components/placements/tpo-settings-nav.tsx");
  for(const label of ["Placement Rules","Placement Branding","What Companies See","Public placements","Recruiter access"])expect(value).toContain('label:"'+label+'"');
 });
 it("TPO-settings-audit-06 protects edited readiness choices against accidental navigation",()=>{
  const value=source("src/components/tpo/tpo-prep-readiness-editor.tsx");
  expect(value).toContain('window.addEventListener("beforeunload",before)');
  expect(value).toContain("const dirty=");
 });
 it("TPO-settings-audit-13 hides internal storage labels from college-rule explanations",()=>{
  const value=source("src/app/(authenticated)/tpo/settings/rules/page.tsx");
  expect(value).toContain("These are your saved college placement rules.");
  expect(value).not.toContain("placement_college_rules row");
 });
 it("TPO-settings-audit-42 makes readiness courses searchable while retaining selected values",()=>{
  const value=source("src/components/tpo/tpo-prep-readiness-editor.tsx");
  expect(value).toContain("Find a preparation course");
  expect(value).toContain("With none picked, nobody is marked as needing prep.");
  expect(value).toContain("apiFetch");
 });
 it("TPO-settings-audit-73 restores the sharing rules explanation and percentage labels",()=>{
  const value=source("src/components/tpo/tpo-company-visibility-editor.tsx");
  expect(value).toContain("How sharing works");
  expect(value).toContain("Show 10th and 12th / diploma %");
  expect(value).toContain("Show project links (GitHub, portfolio)");
 });
 it("TPO-settings-audit-75 acknowledges public-page on and off states",()=>{
  const value=source("src/app/(authenticated)/tpo/settings/public-page/page.tsx");
  expect(value).toContain("Your placements page is live");
  expect(value).toContain("Your placements page is off");
 });
 it("TPO-settings-audit-94 uses old activity names rather than raw internal action codes",()=>{
  expect(formatTpoAuditEventType("PLACEMENTS_COLLEGE_RULES_UPDATED")).toBe("Placement rules changed");
  expect(formatTpoAuditEventType("placements.tpo_job_type.created")).toBe("Job types changed");
 });
 it("TPO-settings-audit-96 keeps the TPO audit heading customer-facing",()=>{
  const value=source("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(value).toContain("A traceable history of placement decisions, changes, sharing and access across the workspace.");
  expect(value).toContain('label: "Logged events"');
 });
});