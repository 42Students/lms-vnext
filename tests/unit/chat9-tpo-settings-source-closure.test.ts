import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const text=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("TPO settings audited source features",()=>{
 it("TPO-settings-audit-53 verifies existing implementation in src/modules/placements/tpo-recruiter-grant-write-service.ts",()=>{
  const source=text("src/modules/placements/tpo-recruiter-grant-write-service.ts");
  expect(source).toContain("await tx.insert(placementTpoCollegeSettings)");
 });
 it("TPO-settings-audit-20 verifies existing implementation in src/components/tpo/tpo-builtin-job-types-editor.tsx",()=>{
  const source=text("src/components/tpo/tpo-builtin-job-types-editor.tsx");
  expect(source).toContain("Built-in");
  expect(source).toContain("countsAsPlaced");
  expect(source).toContain("in the drive form");
 });
 it("TPO-settings-audit-21 verifies existing implementation in src/components/tpo/tpo-job-types-editor.tsx",()=>{
  const source=text("src/components/tpo/tpo-job-types-editor.tsx");
  expect(source).toContain("TpoUnifiedJobTypesEditor");
  const editor=text("src/components/tpo/tpo-unified-job-types-editor.tsx");
  expect(editor).toContain('aria-label="New job type"');
  expect(editor).toContain("countsAsPlaced");
 });
 it("TPO-settings-audit-22 verifies partial implementation in src/modules/placements/tpo-job-type-write-service.ts",()=>{
  const source=text("src/modules/placements/tpo-job-type-write-service.ts");
  expect(source).toContain("TPO_JOB_TYPE_LIMIT");
  expect(source).toContain("TPO_JOB_TYPE_LAST_ACTIVE");
  expect(source).toContain("renameSchema");
 });
 it("TPO-settings-audit-30 verifies existing implementation in src/modules/placements/tpo-after-college-model.ts",()=>{
  const source=text("src/modules/placements/tpo-after-college-model.ts");
  expect(source).toContain("AFTER_COLLEGE_OUTCOMES");
  expect(source).toContain("NOT_INTERESTED");
  expect(source).toContain("DEBARRED");
 });
 it("TPO-settings-audit-31 verifies partial implementation in src/modules/placements/tpo-outcome-label-settings-service.ts",()=>{
  const source=text("src/modules/placements/tpo-outcome-label-settings-service.ts");
  expect(source).toContain("min(2).max(60)");
  expect(source).toContain("max(30)");
  expect(source).toContain("outcomeLabels:labels");
 });
 it("TPO-settings-audit-32 verifies existing implementation in src/app/(authenticated)/tpo/settings/after-college/page.tsx",()=>{
  const source=text("src/app/(authenticated)/tpo/settings/after-college/page.tsx");
  expect(source).toContain("After college");
  expect(source).toContain("TpoOutcomeLabelsEditor");
 });
 it("TPO-settings-audit-43 verifies existing implementation in src/components/tpo/tpo-blocked-dates-editor.tsx",()=>{
  const source=text("src/components/tpo/tpo-blocked-dates-editor.tsx");
  expect(source).toContain("Show past blocked dates");
  expect(source).toContain("Remove whole range");
  expect(source).toContain("Maximum 90 days per range");
 });
 it("TPO-settings-audit-44 verifies partial implementation in src/modules/placements/tpo-round-calendar-service.ts",()=>{
  const source=text("src/modules/placements/tpo-round-calendar-service.ts");
  expect(source).toContain("acknowledgedBlockedDate");
  expect(source).toContain("placementTpoBlockedDates");
 });
 it("TPO-settings-audit-52 verifies partial implementation in src/components/tpo/tpo-communication-settings-editors.tsx",()=>{
  const source=text("src/components/tpo/tpo-communication-settings-editors.tsx");
  expect(source).toContain("Recruiter access lasts");
  expect(source).toContain("recruiterAccessMonths");
  expect(source).toContain("No end date is unavailable");
 });
 it("TPO-settings-audit-54 verifies partial implementation in src/components/tpo/tpo-trusted-domain-editor.tsx",()=>{
  const source=text("src/components/tpo/tpo-trusted-domain-editor.tsx");
  expect(source).toContain("Free-mail addresses cannot be trusted");
  expect(source).toContain("Stop trusting @");
  expect(source).toContain("Trust @");
 });
 it("TPO-settings-audit-56 verifies existing implementation in src/components/placements/tpo-recruiter-grant-controls.tsx",()=>{
  const source=text("src/components/placements/tpo-recruiter-grant-controls.tsx");
  expect(source).toContain("TpoRecruiterExtend");
  expect(source).toContain("Give access again");
  expect(source).toContain("Access extended");
 });
 it("TPO-settings-audit-57 verifies partial implementation in src/app/(authenticated)/tpo/settings/recruiters/page.tsx",()=>{
  const source=text("src/app/(authenticated)/tpo/settings/recruiters/page.tsx");
  expect(source).toContain('title="Recruiter access"');
  expect(source).toContain('header:"Verification"');
  expect(source).toContain("Ended or removed");
  expect(source).toContain('"No end date"');
 });
 it("TPO-settings-audit-70 verifies existing implementation in src/components/tpo/tpo-communication-settings-editors.tsx",()=>{
  const source=text("src/components/tpo/tpo-communication-settings-editors.tsx");
  expect(source).toContain("Monthly limit on optional SMS");
  expect(source).toContain("smsMonthlyCap");
  expect(source).toContain("Save");
 });
 it("TPO-settings-audit-72 verifies existing implementation in src/components/tpo/tpo-company-visibility-editor.tsx",()=>{
  const source=text("src/components/tpo/tpo-company-visibility-editor.tsx");
  expect(source).toContain("Save what companies can see?");
  expect(source).toContain("Sharing policy changed elsewhere");
  expect(source).toContain("Saved");
 });
 it("TPO-settings-audit-74 verifies partial implementation in src/app/(authenticated)/tpo/settings/public-page/page.tsx",()=>{
  const source=text("src/app/(authenticated)/tpo/settings/public-page/page.tsx");
  expect(source).toContain("Published placement preview");
  expect(source).toContain('aria-label="Published placement preview"');
  expect(source).toContain("Not enough data yet");
 });
 it("TPO-settings-audit-76 verifies partial implementation in src/components/tpo/tpo-communication-settings-editors.tsx",()=>{
  const source=text("src/components/tpo/tpo-communication-settings-editors.tsx");
  expect(source).toContain("Email signature");
  expect(source).toContain("TpoEmailSignatureEditor");
  expect(source).toContain("Save");
 });
 it("TPO-settings-audit-92 verifies existing implementation in src/app/(authenticated)/tpo/audit/page.tsx",()=>{
  const source=text("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(source).toContain("Filter audit by category");
  expect(source).toContain("Filter the audit log");
  expect(source).toContain("Apply filters");
 });
 it("TPO-settings-audit-93 verifies partial implementation in src/app/(authenticated)/tpo/audit/page.tsx",()=>{
  const source=text("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(source).toContain("Export audit-log CSV");
  expect(source).toContain("/api/placements/tpo/audit/export");
 });
 it("TPO-settings-audit-04 verifies existing implementation in src/components/tpo/tpo-legacy-settings-redirect.tsx",()=>{
  const source=text("src/components/tpo/tpo-legacy-settings-redirect.tsx");
  expect(source).toContain("jobtypes");
  expect(source).toContain("webpage");
  expect(source).toContain("notices");
 });
 it("TPO-settings-audit-14 verifies existing implementation in src/modules/placements/tpo-policy-service.ts",()=>{
  const source=text("src/modules/placements/tpo-policy-service.ts");
  expect(source).toContain("placements.tpo_college_rules.changed");
  expect(source).toContain("placements.tpo_company_visibility.changed");
  expect(source).toContain("activityEvents");
 });
 it("TPO-settings-audit-24 verifies existing implementation in src/modules/placements/tpo-configuration-model.ts",()=>{
  const source=text("src/modules/placements/tpo-configuration-model.ts");
  expect(source).toContain(".min(2).max(40)");
  expect(source).toContain("2-40 letters, digits or simple punctuation");
 });
 it("TPO-settings-audit-25 verifies partial implementation in src/components/tpo/tpo-job-types-editor.tsx",()=>{
  const source=text("src/components/tpo/tpo-job-types-editor.tsx");
  expect(source).toContain("TpoUnifiedJobTypesEditor");
  const editor=text("src/components/tpo/tpo-unified-job-types-editor.tsx");
  expect(editor).toContain("Job types saved");
  expect(editor).toContain("Job types were not saved");
 });
 it("TPO-settings-audit-45 verifies existing implementation in src/components/tpo/tpo-blocked-dates-editor.tsx",()=>{
  const source=text("src/components/tpo/tpo-blocked-dates-editor.tsx");
  expect(source).toContain("No upcoming blocked dates.");
  expect(source).toContain("Blocked dates saved");
  expect(source).toContain("min={today}");
 });
 it("TPO-settings-audit-58 verifies partial implementation in src/app/(authenticated)/tpo/settings/recruiters/page.tsx",()=>{
  const source=text("src/app/(authenticated)/tpo/settings/recruiters/page.tsx");
  expect(source).toContain("Ending in 30 days");
  expect(source).toContain("Ended or removed");
  expect(source).toContain("Search name, designation or company");
 });
 it("TPO-settings-audit-59 verifies partial implementation in src/components/placements/tpo-recruiter-grant-controls.tsx",()=>{
  const source=text("src/components/placements/tpo-recruiter-grant-controls.tsx");
  expect(source).toContain("Remove ");
  expect(source).toContain("Access removed");
  expect(source).toContain("<ConfirmDialog open={confirmOpen}");
  expect(source).toContain("onConfirm={()=>void revoke()}");
  expect(source).toContain("expectedUpdatedAt");
  expect(source).not.toContain("window.confirm");
 });
 it("TPO-settings-audit-71 verifies partial implementation in src/app/(authenticated)/tpo/settings/notices/page.tsx",()=>{
  const source=text("src/app/(authenticated)/tpo/settings/notices/page.tsx");
  expect(source).toContain("Student Notices & Preparation");
  expect(source).toContain("Emails switched on");
  expect(source).toContain("Always sent (email and SMS)");
 });
 it("TPO-settings-audit-82 verifies existing implementation in src/components/placements/tpo-settings-nav.tsx",()=>{
  const source=text("src/components/placements/tpo-settings-nav.tsx");
  expect(source).toContain('id:"rules"');
  expect(source).toContain('id:"team"');
 });
 it("TPO-settings-audit-97 verifies partial implementation in src/components/tpo/tpo-audit-grid.tsx",()=>{
  const source=text("src/components/tpo/tpo-audit-grid.tsx");
  expect(source).toContain("Copy rows");
  expect(source).toContain("setOldestFirst");
  expect(source).toContain("Rows copied");
 });

});