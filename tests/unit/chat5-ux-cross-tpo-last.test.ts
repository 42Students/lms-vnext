import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const routes=["/tpo/reports/by-branch","/tpo/reports/by-company","/tpo/reports/ctc","/tpo/reports/failure-reasons","/tpo/reports/intelligence","/tpo/reports/joining-followups","/tpo/reports/joining-status","/tpo/reports/leads","/tpo/reports/offers-acceptance","/tpo/reports/offers-expiry","/tpo/reports/placed-branch","/tpo/reports/placement-summary","/tpo/reports/season-pipeline","/tpo/reports/unplaced","/tpo/requests","/tpo/settings","/tpo/settings/after-college","/tpo/settings/blocked-dates","/tpo/settings/branding","/tpo/settings/job-types","/tpo/settings/notices","/tpo/settings/notifications","/tpo/settings/prep-readiness","/tpo/settings/public-link","/tpo/settings/public-page","/tpo/settings/recruiters","/tpo/settings/rules","/tpo/settings/season","/tpo/settings/see","/tpo/settings/team","/tpo/settings/templates","/tpo/settings/trusted","/tpo/students","/tpo/students/[membershipId]/history","/tpo/students/[membershipId]/participation","/tpo/students/preparation-plan","/tpo/students/preparation-prep","/tpo/students/requests","/tpo/team","/tpo/team/[threadId]","/tpo/team/everyone","/tpo/verification"] as const;
const slug=(route:string)=>route.slice(5).replace(/[\[\]\/]+/g,"-").replace(/-+/g,"-").replace(/-$/,"").toLowerCase();
const pagePath=(route:string)=>"src/app/(authenticated)"+route+"/page.tsx";
// Existing dynamic-route note filenames preserve the parameter spelling (membershipId/threadId).
const notePath=(route:string)=>"docs/audit/ux/tpo-"+route.slice(5).replace(/[\[\]\/]+/g,"-").replace(/-+/g,"-").replace(/-$/,"")+".md";

describe("Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126)",()=>{
 for(const route of routes){
  const id="UX-tpo-"+slug(route)+"-09";
  it(id+" preserves legacy page wording while enforcing authenticated shell and contrast invariants",()=>{
   const page=source(pagePath(route)),note=source(notePath(route));
   expect(page).not.toContain("text-[#");
   expect(page).not.toMatch(/<main(?=[\s>])/);
   expect(page).not.toContain("window.alert(");
   expect(page).not.toContain("window.prompt(");
   expect(page).not.toContain("min-h-10");
   expect(note).toContain(route);
  });
 }
 for(const [route,columns] of [
  ["/tpo/settings/notifications",["Subject","Module","Read status","Received"]],
  ["/tpo/settings/recruiters",["Recruiter","Company","Joined through","Access","Actions","Granted","Valid through (IST)","Verification","Revoked"]],
  ["/tpo/settings/team",["Member","Role / assignment","Membership status","Student duties"]],
  ["/tpo/settings/trusted",["Company","Trust status","Company primary domain"]],
 ] as const){
  it("UX-tpo-"+slug(route)+"-10 exposes all list data and actions via mobile DataTable with explicit empty copy",()=>{
   const page=source(pagePath(route));
   expect(page).toContain("<DataTable");
   expect(page).toMatch(/empty={<(?:p|EmptyState)\b/);
   expect(page).toContain('mobilePriority:"primary"');
   expect((page.match(/mobilePriority:"secondary"/g)??[])).toHaveLength(route.endsWith("/settings/team")?4:columns.length-(route.endsWith("/recruiters")?2:1));
   if(route.endsWith("/recruiters"))expect(page).toContain('mobilePriority:"action"');
   for(const title of columns) expect(page).toContain('header:"'+title+'"');
   expect(page).not.toMatch(/<table\b/);
  });
 }
 it("UX-tpo-settings-recruiters-11 preserves both capabilities and verification plus guarded revoke/extend actions",()=>{
  const page=source(pagePath("/tpo/settings/recruiters"));
  expect(page).toContain("item.capabilities.join");
  expect(page).toContain("item.verificationStatus");
  expect(page).toContain("TpoRecruiterExtend");
  expect(page).toContain("TpoRecruiterRevoke");
  expect(page).toContain("item.expectedUpdatedAt");
 });
 it("UX-tpo-settings-trusted-11 retains mutable trust controls and allows company detail links on phone",()=>{
  const page=source(pagePath("/tpo/settings/trusted"));
  expect(page).toContain("TpoTrustToggle");
  expect(page).toContain('relationshipId={company.relationshipId}');
  expect(page).toContain("company.companyId");
  expect(page).toContain("Company metadata; not an allowlist grant");
 });
 it("UX-tpo-settings-team-11 keeps college scoped member roles, assignment links and dates",()=>{
  const page=source(pagePath("/tpo/settings/team"));
  expect(page).toContain("TPO_TEAM_ROLE_LABELS[role]");
  expect(page).toContain("member.studentDuties.map");
  expect(page).toContain("dutyDate(duty.onDate)");
  expect(page).toContain("encodeURIComponent(duty.jobId)");
 });
 it("UX-tpo-settings-notifications-11 preserves critical/unread badges and IST receipts",()=>{
  const page=source(pagePath("/tpo/settings/notifications"));
  expect(page).toContain('item.importance==="CRITICAL"');
  expect(page).toContain('item.status==="UNREAD"');
  expect(page).toContain("formatWhen(item.createdAt)} IST");
 });
 it("UX-tpo-settings-trusted-12 replaces native prompts with focus-managed reason and college-scoped confirmation",()=>{
  const component=source("src/components/placements/tpo-trust-toggle.tsx");
  expect(component).not.toMatch(/window\.(confirm|prompt)/);
  expect(component).toContain("<ConfirmDialog");
  expect(component).toContain("Textarea");
  expect(component).toContain("reason.trim().length>=8");
  expect(component).toContain("expectedTrusted:isTrusted");
  expect(component).toContain("nextTrusted,reason:reason.trim(),confirmed:true");
  expect(component).toContain("not recruiter-domain allowlisting or direct login permissions");
 });
 it("UX-tpo-settings-trusted-13 uses a focus-managed domain confirmation and keeps verification warning",()=>{
  const component=source("src/components/tpo/tpo-trusted-domain-editor.tsx");
  expect(component).not.toContain("window.confirm");
  expect(component).toContain("<ConfirmDialog");
  expect(component).toContain("Only verified recruiters are eligible.");
  expect(component).toContain('role={statusTone==="error"?"alert":"status"}');
  expect(component).toContain('<Alert tone={statusTone}>{status}</Alert>');
  expect(component).toContain('action:"REMOVE"');
  expect(component).toContain('action:"TRUST"');
 });
 it("UX-tpo-settings-recruiters-12 reviews grant, revoke and extension without native confirmations",()=>{
  const control=source("src/components/placements/tpo-recruiter-grant-controls.tsx");
  expect(control).not.toContain("window.confirm");
  expect((control.match(/<ConfirmDialog/g)??[])).toHaveLength(3);
  expect((control.match(/error\?<InlineNotice tone="error"/g)??[])).toHaveLength(3);
  expect(control).toContain("Grant the existing user recruiter access to this college/company?");
  expect(control).toContain('expectedUpdatedAt');
  expect(control).toContain('action: "REVOKE"');
  expect(control).toContain('action:"EXTEND"');
  expect(control).toContain('months');
  expect(control).not.toContain("min-h-9");
 });
 it("UX-tpo-requests-10 preserves server-authorized request decisions and 44px approval targets",()=>{
  const control=source("src/components/placements/tpo-request-decision-control.tsx");
  expect(control).toContain("apiFetch");
  expect(control).toContain('method:"POST"');
  expect(control).toContain("<Dialog");
  expect(control).not.toContain("min-h-10");
  expect(control).not.toContain("text-[#26bac7]");
  expect(control).toContain("expectedUpdatedAt");
 });
 for(const route of ["/tpo/students/[membershipId]/history","/tpo/students/[membershipId]/participation",
  "/tpo/team/[threadId]","/tpo/team/everyone","/tpo/verification"] as const){
  it("UX-tpo-"+slug(route)+"-02 includes a new per-page finding, state and test trail",()=>{
   const note=source(notePath(route));
   expect(note).toContain("UX-CROSS-TPO-NOTE");
   expect(note).toContain("loading");
   expect(note).toContain(route);
  });
 }
});
