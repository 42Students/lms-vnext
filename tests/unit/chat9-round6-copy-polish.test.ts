import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {formatTpoAuditEventType} from "../../src/modules/placements/tpo-audit-model";
const file=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO Audit and College Projects copy reconciliation",()=>{
 it("TPO-settings-audit-94 maps known setting changes to customer-readable actions",()=>{
  expect(formatTpoAuditEventType("placements.tpo_company_visibility.updated")).toBe("Company sharing settings changed");
  expect(formatTpoAuditEventType("placements.tpo_public_placement.updated")).toBe("Public placements setting changed");
  expect(formatTpoAuditEventType("placements.tpo_followup.created")).toBe("Recruiter follow-up added");
 });
 it("TPO-settings-audit-96 removes internal audit count labels and retains the legacy empty state",()=>{
  const s=file("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(s).not.toContain('label: "Canonical activity"');
  expect(s).toContain("Nothing logged yet");
  expect(s).toContain("Every drive, decision and setting change your team makes shows up here.");
  expect(file("src/app/(authenticated)/tpo/audit/error.tsx")).toContain("Could not load the audit log");
 });
 it("COL-projects-21 restores Create workspace and Bulk reassign mentor CTA wording",()=>{
  expect(file("src/components/projects/project-create-control.tsx")).toContain("Create workspace");
  expect(file("src/app/(authenticated)/college/projects/page.tsx")).toContain("Bulk reassign mentor");
 });
});
