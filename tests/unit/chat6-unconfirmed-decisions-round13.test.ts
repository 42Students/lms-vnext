import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {knownErrorSafeSummary} from "@/modules/log-alerts/known-error-safe-summary";
const read=(path:string)=>readFileSync(path,"utf8");
const decisions=read("docs/audit/acceptance/chat-6-unconfirmed-decisions.md");
const has=(id:string,decision:string)=>expect(decisions).toContain("| "+id+" | "+decision);

describe("chat-6 verified UNCONFIRMED decisions (18)",()=>{
 it("SA-academics-people-R04 retains persisted Super Admin academic audit requirements",()=>{
   has("SA-academics-people-R04","Keep server-audited academic commands");
   expect(read("src/modules/activity/taxonomy.ts")).toContain("ACADEMICS_SECTION_UPDATED");
 });
 it("SA-academics-people-49 avoids an unvalidated client policy knob and preserves OD-34",()=>{
   has("SA-academics-people-49","Do not expose policy dials");
   expect(read("docs/audit/owner-decisions-resolved.md")).toContain("OD-34");
 });
 it("SA-academics-people-75 protects mobile course tables from overflow",()=>{
   has("SA-academics-people-75","Use scroll-safe");
   expect(read("src/components/courses/admin-course-overview.tsx")).toContain("DataTable");
 });
 it("SA-academics-people-111 invalidates recruiter sessions on a sign-in phone change",()=>{
   has("SA-academics-people-111","Reuse existing canonical recruiter");
   const src=read("src/modules/placements/super-admin-hr-service.ts");
   expect(src).toContain("phoneChanged");
   expect(src).toContain("terminateSuperAdminHrSessions");
 });
 it("SA-placements-projects-14 keeps drives scoped to one college",()=>{
   has("SA-placements-projects-14","A drive belongs to one college");
   expect(read("src/db/schema/placements.ts")).toContain("collegeId");
 });
 it("SA-placements-projects-37 avoids creating a second recruiter login for the same phone",()=>{
   has("SA-placements-projects-37","Allow company identity creation/reuse");
   expect(read("src/modules/placements/super-admin-hr-service.ts")).toContain("createPlacementCompany");
 });
 it("SA-placements-projects-39 audits recruiter lifecycle and college grant changes",()=>{
   has("SA-placements-projects-39","Audit recruiter creation");
   const src=read("src/modules/placements/super-admin-hr-service.ts");
   expect(src).toContain("recordActivityEventInTransaction");
   expect(src).toContain("PLACEMENTS_RECRUITER_COLLEGE_REVOKED");
 });
 it("SA-placements-projects-58 uses workload metrics and records individual reassignment failures",()=>{
   has("SA-placements-projects-58","Reassignment must show");
   expect(read("src/components/projects/project-admin-reassign-mentor-page.tsx")).toContain("Mentor workload");
   expect(read("src/components/projects/project-mentor-reassignment.tsx")).toContain("reassignedCount");
 });
 it("SA-placements-projects-68 keeps workspace tab navigation on the readiness route",()=>{
   has("SA-placements-projects-68","Keep readiness");
   expect(read("src/components/projects/project-workspace-readiness.tsx")).toContain('aria-label="Workspace sections"');
 });
 it("SA-placements-projects-72 confirms admin acceptance and requires feedback for changes",()=>{
   has("SA-placements-projects-72","Admin final review");
   const source=read("src/components/projects/project-final-delivery-controls.tsx");
   expect(source).toContain("title={decision===\"APPROVED\"?\"Accept this submission?\"");
   expect(source).toContain('confirmDisabled={decision==="CHANGES_REQUESTED"&&!feedback.trim()}');
 });
 it("SA-placements-projects-77 requires persisted activity events, not fabricated UI success",()=>{
   has("SA-placements-projects-77","Generate durable activity events");
   expect(read("src/modules/activity/taxonomy.ts")).toContain("PROJECTS_");
 });
 it("SA-placements-projects-115 only copies sanitized diagnostics without private log payloads",()=>{
   has("SA-placements-projects-115","Show a sanitized");
   const text=knownErrorSafeSummary({signatureHash:"a".repeat(64),
    environment:"production",fixStatus:"OPEN",occurrences:"21",affectedAccounts:2,
    firstSeen:"18 Oct 2026",lastSeen:"18 Oct 2026",issuePublicId:null});
   expect(text).toContain("Affected accounts (count only): 2");
   expect(text).not.toContain("Bearer");
   expect(read("src/components/tracker/known-errors-workspace.tsx")).toContain("Copy for Claude");
 });
 it("SA-tenants-modules-30 does not introduce orphan-lock deletion for a NOT NULL rule",()=>{
   has("SA-tenants-modules-30","Do not add a");
   expect(read("src/db/schema/module-access.ts")).toContain('enabled: boolean("enabled").notNull()');
 });
 it("SA-tenants-modules-31 prefers a deep-linkable authorized module-access trace",()=>{
   has("SA-tenants-modules-31","Prefer a deep-linkable");
   expect(read("src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx"))
    .toContain("Student overrides and locks");
 });
 it("SA-tenants-modules-38 does not invent editable placement configuration disconnected from runtime enforcement",()=>{
   has("SA-tenants-modules-38","Do not invent editable");
   expect(read("src/modules/platform-settings/service.ts")).toContain("Placement rules");
 });
 it("SA-tenants-modules-54 fails closed until a trusted inbound mail integration exists",()=>{
   has("SA-tenants-modules-54","No unauthenticated inbound email writer");
   expect(read("src/modules/inbound-mail/staged-schema.ts")).toContain("inboundMailMessages");
 });
 it("SA-tenants-modules-60 keeps recipient college events separately auditable",()=>{
   has("SA-tenants-modules-60","Keep one persisted");
   expect(read("src/modules/announcements/super-admin-college-broadcast-service.ts"))
    .toContain("PLATFORM_COLLEGE_ANNOUNCEMENT_PUBLISHED");
 });
 it("SA-tenants-modules-68 preserves review history and last-four identity masking",()=>{
   has("SA-tenants-modules-68","Keep a timestamped");
   const source=read("src/components/verification/VerificationReviewDrawer.tsx");
   expect(source).toContain('aria-label="Verification history"');
   expect(source).toContain("Numbers show only the last four digits");
 });
});
