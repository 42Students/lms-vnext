import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {formatTpoAuditEventType} from "../../src/modules/placements/tpo-audit-model";
const code=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 TPO settings and audit evidence round 6",()=>{
 it("TPO-settings-audit-33 shows persisted after-college outcomes on Students and allows college-scoped editing",()=>{
  const page=code("src/app/(authenticated)/tpo/students/page.tsx");
  const grid=code("src/components/tpo/tpo-students-spreadsheet.tsx");
  const service=code("src/modules/placements/tpo-students-service.ts");
  expect(page).toContain("getTpoAfterCollegeForRoster");
  expect(page).toContain("afterCollege");
  expect(grid).toContain("TpoAfterCollegeEditor");
  expect(grid).toContain("TpoAfterCollegeBulkEditor");
  expect(service).toContain("readTpoAfterCollegeMatches");
 });
 it("TPO-settings-audit-73 restores the legacy three sharing fields and five explanations while retaining advanced settings",()=>{
  const s=code("src/components/tpo/tpo-company-visibility-editor.tsx");
  for(const txt of ["How sharing works","75-80%","Show 10th and 12th / diploma %","Show project links (GitHub, portfolio)","Additional sharing options"])expect(s).toContain(txt);
 });
 it("TPO-settings-audit-75 uses the legacy public placement switch and on/off confirmation sentences",()=>{
  const s=code("src/components/placements/tpo-public-placement-toggle.tsx");
  for(const txt of ["Turn placements page on","Turn placements page off","Your placements page is live","Your placements page is off"])expect(s).toContain(txt);
 });
 it("TPO-settings-audit-94 renders recorded setting/recruiter changes as understandable actions",()=>{
  expect(formatTpoAuditEventType("PLACEMENTS_COLLEGE_RULES_UPDATED")).toBe("Placement rules changed");
  expect(formatTpoAuditEventType("placements.tpo_followup.moved")).toBe("Recruiter follow-up moved");
  expect(formatTpoAuditEventType("placements.tpo_communication_setting.updated")).toBe("Placement settings changed");
 });
 it("TPO-settings-audit-96 shows the legacy audit empty-state copy without implementation identifiers",()=>{
  const s=code("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(s).toContain("Nothing logged yet");
  expect(s).toContain("Every drive, decision and setting change your team makes shows up here.");
 });
 it("TPO-settings-audit-03 avoids developer-only persistence labels in What Companies See",()=>{
  const s=code("src/app/(authenticated)/tpo/settings/see/page.tsx");
  expect(s).toContain("Saved for your college");
  expect(s).toContain("Standard college settings");
  expect(s).not.toContain("Source default");
 });
});
