import { describe,it,expect } from "vitest";
import { readFileSync } from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("chat-13 TPO second-third cross-audit repairs",()=>{
 it("UX-cross-tpo-second-C13-001 letters use responsive accessible evidence, no falsified letter states",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx");
  expect(s).toContain('DataTable<(typeof offers)[number]>');
  expect(s).toContain('Letter acknowledged');
  expect(s).toContain('empty={<EmptyState title="No persisted offers exist for this drive."');
  expect(s).toContain('Unavailable');
  expect(s).not.toContain('<table');
 });
 it("UX-cross-tpo-second-C13-002 share audit preserves UTC evidence on phone and paging",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx");
  expect(s).toContain('<DataTable');
  expect(s).toContain('timeZone:"Asia/Kolkata"');
  expect(s).toContain('+" IST"');
  expect(s).toContain('No share-page views or CSV downloads match this event filter for this drive.');
  expect(s).toContain('companyShareAuditPageHref');
  expect(s).not.toContain('<table');
 });
 it("UX-cross-tpo-second-C13-003 shortlist retains evidence fields and all result states",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx");
  expect(s).toContain('DataTable<(typeof data.rows)[number]>');
  expect(s).toContain('Shortlisted at (IST)');
  expect(s).toContain('Decision timestamp unavailable');
  expect(s).toContain('A previously shortlisted learner may have withdrawn');
  expect(s).not.toContain('<table');
 });
 it("UX-cross-tpo-second-C13-004 share preview renders one responsive authorized candidate list",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx");
  expect(s).toContain('<DataTable<(typeof data.rows)[number]>');
  expect(s).toContain('mobilePriority:"primary"');
  expect(s).toContain('No recruiter-visible shortlisted applications are recorded');
  expect(s).toContain('CompanyShareControls');
  expect(s).not.toContain('sm:hidden');
  expect(s).not.toContain('<table');
 });
 it("UX-cross-tpo-second-C13-005 rounds preserve externally usable links without new windows",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx");
  expect(s).toContain('Meeting link');
  expect(s).toContain('Test link');
  expect(s).not.toContain('target="_blank"');
  expect(s).toContain('min-h-11');
 });
 it("UX-cross-tpo-second-C13-006 overview primary actions are WCAG sized and contrast safe",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/overview/page.tsx");
  expect(s).toContain("min-h-11");
  expect(s).toContain("md:min-h-9");
  expect(s).toContain('href="/tpo/placements/new"');
  expect(s).toContain("+ Create drive");
 });
 it("UX-cross-tpo-second-C13-007 campaign CTA contrast and phone link targets",()=>{
  const s=read("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  expect(s).toContain('bg-primary');
  expect(s).toContain('text-on-primary');
  expect(s).toContain('New email campaign');
  expect(s).toContain('min-h-11');
 });
 it("UX-cross-tpo-second-C13-009 close preview uses accessible focus-managed confirmation and safe errors",()=>{
  const s=read("src/components/placements/tpo-drive-close-preview-form.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain('title="Close this drive?"');
  expect(s).toContain('expectedCounts:preview.counts');
  expect(s).not.toContain("window.confirm");
  expect(s).not.toContain("body?.error");
 });
 it("UX-cross-tpo-second-C13-010 round result staging uses an accessible guarded confirm dialog",()=>{
  const s=read("src/components/placements/tpo-round-result-entry-form.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain('title="Stage this round result?"');
  expect(s).toContain("validatedPayload.current");
  expect(s).not.toContain("window.confirm");
  expect(s).toContain("min-h-11");
 });
 it("UX-cross-tpo-second-C13-011 cancellation reason options are 44px and readable",()=>{
  const s=read("src/components/placements/tpo-drive-cancel-form.tsx");
  expect(s).not.toContain("min-h-10");
  expect(s).not.toContain("text-[#26bac7]");
  expect(s).toContain("useGuardedAction");
  expect(s).toContain("expectedImpact: preview.impact");
 });
 it("UX-cross-tpo-second-C13-012 after-college report paginates 300-row evidence while retaining CSV",()=>{
  const s=read("src/app/(authenticated)/tpo/reports/after-college/page.tsx");
  expect(s).toContain("data.rows.slice((page-1)*25,page*25)");
  expect(s).toContain('<Pagination page={page}');
  expect(s).toContain("data.rows.length>300");
  expect(s).toContain("Download CSV");
 });
 it("UX-cross-tpo-second-C13-013 campaign recipients paginate and preserve storage cap disclosure",()=>{
  const s=read("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx");
  expect(s).toContain('recipients.rows.slice((page-1)*25,page*25)');
  expect(s).toContain("<Pagination page={page}");
  expect(s).toContain("recipients.hasMore");
  expect(s).toContain("TpoCampaignSendControl");
 });
 it("UX-cross-tpo-second-C13-014 send campaign confirmation is accessible and cannot auto-send",()=>{
   const s=read("src/components/tpo/tpo-campaign-send-control.tsx");
   expect(s).toContain("<ConfirmDialog");
   expect(s).toContain("This sends to the currently reachable recruiters and cannot be undone.");
   expect(s).toContain("async function sendCampaign()");
   expect(s).not.toContain("window.confirm");
 });
 it("UX-cross-tpo-second-C13-015 waitlist ranking is readable on phone and release requires dialog",()=>{
   const s=read("src/components/placements/tpo-waitlist-promotion-control.tsx");
   expect(s).toContain("<DataTable");
   expect(s).toContain("<ConfirmDialog");
   expect(s).toContain("expectedPreviewToken:preview.previewToken");
   expect(s).not.toContain("window.confirm");
   expect(s).not.toContain("<table");
 });
 it("UX-cross-tpo-second-C13-016 round import requests accessible confirmation before staging",()=>{
  const s=read("src/components/placements/tpo-round-results-import.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain('confirmLabel="Confirm and stage results"');
  expect(s).toContain('preview.previewToken');
  expect(s).not.toContain("window.confirm");
 });
 it("UX-cross-tpo-second-C13-017 bulk results remain two-step and cap 25",()=>{
  const s=read("src/components/placements/tpo-bulk-round-result-recorder.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain("pendingTotal > 25");
  expect(s).toContain("stageSelected(true)");
  expect(s).not.toContain("window.confirm");
  expect(s).not.toContain("min-h-10");
 });
 it("UX-cross-tpo-second-C13-018 company-share revoke uses accessible dialog and preserves lifecycle",()=>{
  const s=read("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain('title="Revoke this company applicant link?"');
  expect(s).toContain("afterCompanyShareRevocation");
  expect(s).toContain("setRevokeTarget(link.id)");
  expect(s).not.toContain("window.confirm");
  expect(s).not.toContain("min-h-10");
 });
 it("UX-cross-tpo-second-C13-019 selection recording traps focus and release has separate confirmation",()=>{
  const s=read("src/components/placements/tpo-drive-selection-manager.tsx");
  expect(s).toContain("<Dialog open={mode!==null}");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain('submit(true)');
  expect(s).toContain("<DataTable");
  expect(s).not.toContain('role="dialog"');
  expect(s).not.toContain('window.confirm');
 });
 it("UX-cross-tpo-second-C13-020 interview scheduling confirms all destructive operations accessibly",()=>{
  const s=read("src/components/placements/tpo-interview-slot-planner.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain('action:"CLEAR_AVAILABLE"');
  expect(s).toContain('action:"ASSIGN_ROOMS_BY_ROLL"');
  expect(s).toContain('action:"CANCEL"');
  expect(s).toContain("setConfirmRequest(");
  expect(s).not.toContain("window.confirm");
  expect(s).not.toContain("min-h-10");
  expect(s).not.toContain("result.issues?.[0]?.message");
 });
 it("UX-cross-tpo-second-C13-021 joining records and corrections require accessible confirmation",()=>{
  const s=read("src/components/placements/tpo-joining-update-form.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain("save(true)");
  expect(s).not.toContain("window.confirm");
  expect(s).toContain("min-h-11");
 });
 it("UX-cross-tpo-second-C13-022 selection import confirms before any recorded offers",()=>{
  const s=read("src/components/placements/tpo-selection-import.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain('No offers will be released yet.');
  expect(s).not.toContain("window.confirm");
 });
 it("UX-cross-tpo-second-C13-023 bulk drive act-on has focus-managed irreversible confirmation",()=>{
  const s=read("src/components/placements/tpo-drive-act-on-panel.tsx");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain("apply(retry,true)");
  expect(s).not.toContain("window.confirm");
  expect(s).toContain("expectedUpdatedAt:row.expectedUpdatedAt");
 });
 it("UX-cross-tpo-second-C13-024 inline round application preview has correct region semantics and no raw server error",()=>{
  const s=read("src/components/placements/tpo-round-apply-control.tsx");
  expect(s).toContain('role="region" aria-label="Round application preview"');
  expect(s).not.toContain('aria-modal="false"');
  expect(s).not.toContain('value.error??');
 });
 it("UX-cross-tpo-second-C13-025 recruiter board and invitations use accessible confirmations and focus trap",()=>{
  const s=read("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(s).toContain('<Dialog open={adding && confirmation?.kind!=="DISCARD"}');
  expect(s).toContain('<ConfirmDialog open={confirmation!==null}');
  expect(s).toContain('moveBoardLeadToContacted(target.leadId,true)');
  expect(s).toContain('createInviteLink(lead,true)');
  expect(s).toContain('closeAddDialog(true)');
  expect(s).not.toContain('window.confirm');
  expect(s).not.toContain('min-h-10');
 });
 it("UX-cross-tpo-second-C13-027 recruiter directory and company communication remain accessible across viewports",()=>{
  const s=read("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(s).toContain('<EngageCompanyTpoGrid rows={visibleCompanies}');
  expect(s).toContain('<RecruiterTpoGrid rows={sortedVisible}');
  expect(s).toContain('mobilePriority:"action"');
  expect(s).toContain('selection={{');
  expect(s).toContain('RecruiterRosterDisplayControls');
  expect(s).toContain('columnKeys.includes(column.key)');
  expect(s).not.toContain('<table');
 });
});
