import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");

/** Source-level rollout only. The orchestrator owns device/WebView and CI evidence. */
describe("chat-5 UX /tpo middle-third route coverage (43–84)",()=>{
 it("UX-tpo-placements-jobs-jobid-applicants-applicationid-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-applicants-applicationid.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/applicants/[applicationId]");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-applicants-applicationid-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-applications-export-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-applications-export.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/applications-export");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-applications-export-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-cancel-preview-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-cancel-preview.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/cancel-preview");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-cancel-preview-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-candidate-schedule-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-candidate-schedule.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/candidate-schedule");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-candidate-schedule-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-change-requests-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-change-requests.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/change-requests");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-change-requests-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-close-preview-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-close-preview.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/close-preview");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-close-preview-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-closeout-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-closeout.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/closeout");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-closeout-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-discussion-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-discussion.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/discussion");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-discussion-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-drive-day-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-drive-day.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/drive-day");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-drive-day-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-edit-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-edit.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/edit");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-edit-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-extend-deadline-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-extend-deadline.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/extend-deadline");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-extend-deadline-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-interview-slots-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-interview-slots.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/interview-slots");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-interview-slots-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-joining-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-joining.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/joining");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-joining-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-letters-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-letters.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/letters");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-letters-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-offers-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-offers.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/offers");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-offers-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-offers-offerid-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-offers-offerid.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/offers/[offerId]");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-offers-offerid-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-rounds-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-rounds.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/rounds");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-rounds-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-rounds-roundid-results-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-rounds-roundid-results.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/rounds/[roundId]/results");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-rounds-roundid-results-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-rounds-roundid-slots-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-rounds-roundid-slots.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-rounds-roundid-slots-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-selections-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-selections.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/selections");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-selections-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-share-audit-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-share-audit.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/share-audit");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-share-audit-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-share-preview-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-share-preview.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/share-preview");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-share-preview-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-shortlist-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-shortlist.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/shortlist");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-shortlist-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-waitlist-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-jobs-jobid-waitlist.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/jobs/[jobId]/waitlist");
  expect(note).toContain("UX-tpo-placements-jobs-jobid-waitlist-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-lifecycle-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/lifecycle/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-lifecycle.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/lifecycle");
  expect(note).toContain("UX-tpo-placements-lifecycle-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-new-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/new/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/new/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-new.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/new");
  expect(note).toContain("UX-tpo-placements-new-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-new-draft-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/new/draft/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/new/draft/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-new-draft.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/new/draft");
  expect(note).toContain("UX-tpo-placements-new-draft-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-overview-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/overview/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/overview/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-overview.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/overview");
  expect(note).toContain("UX-tpo-placements-overview-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-recorded-outside-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/recorded-outside/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-recorded-outside.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/recorded-outside");
  expect(note).toContain("UX-tpo-placements-recorded-outside-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-schedule-conflicts-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/schedule-conflicts/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/placements/schedule-conflicts/loading.tsx");
  const note=source("docs/audit/ux/tpo-placements-schedule-conflicts.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/placements/schedule-conflicts");
  expect(note).toContain("UX-tpo-placements-schedule-conflicts-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-profile-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/profile/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/profile/loading.tsx");
  const note=source("docs/audit/ux/tpo-profile.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/profile");
  expect(note).toContain("UX-tpo-profile-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-recruiters-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/recruiters/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/recruiters");
  expect(note).toContain("UX-tpo-recruiters-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-recruiters-leadid-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/recruiters/[leadId]/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-leadid.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toContain("RecruiterLeadDetailWorkspace");
  const workspace=source("src/components/tpo/recruiter-lead-detail-workspace.tsx");
  expect(workspace.trimStart().startsWith('"use client";')).toBe(true);
  expect(workspace).toContain("<PageHeader");
  expect(workspace).toContain("title={lead.name}");
  expect(workspace).toContain("Retry");
  expect(workspace).toContain("min-h-11");
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/recruiters/[leadId]");
  expect(note).toContain("UX-tpo-recruiters-leadid-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-recruiters-campaigns-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/recruiters/campaigns/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-campaigns.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/recruiters/campaigns");
  expect(note).toContain("UX-tpo-recruiters-campaigns-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-recruiters-campaigns-batchid-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-campaigns-batchid.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/recruiters/campaigns/[batchId]");
  expect(note).toContain("UX-tpo-recruiters-campaigns-batchid-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-recruiters-campaigns-drafts-campaignid-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-campaigns-drafts-campaignid.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/recruiters/campaigns/drafts/[campaignId]");
  expect(note).toContain("UX-tpo-recruiters-campaigns-drafts-campaignid-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-recruiters-campaigns-new-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/campaigns/new/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/recruiters/campaigns/new/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-campaigns-new.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/recruiters/campaigns/new");
  expect(note).toContain("UX-tpo-recruiters-campaigns-new-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-recruiters-campaigns-preview-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/recruiters/campaigns/preview/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/recruiters/campaigns/preview/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-campaigns-preview.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/recruiters/campaigns/preview");
  expect(note).toContain("UX-tpo-recruiters-campaigns-preview-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-reports-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/reports/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/reports/loading.tsx");
  const note=source("docs/audit/ux/tpo-reports.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/reports");
  expect(note).toContain("UX-tpo-reports-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-reports-accreditation-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/reports/accreditation/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/reports/accreditation/loading.tsx");
  const note=source("docs/audit/ux/tpo-reports-accreditation.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/reports/accreditation");
  expect(note).toContain("UX-tpo-reports-accreditation-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-reports-after-college-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/reports/after-college/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/reports/after-college/loading.tsx");
  const note=source("docs/audit/ux/tpo-reports-after-college.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/reports/after-college");
  expect(note).toContain("UX-tpo-reports-after-college-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-reports-branch-season-01 keeps the original route while applying safe responsive controls and recovery",()=>{
  const page=source("src/app/(authenticated)/tpo/reports/branch-season/page.tsx");
  const loading=source("src/app/(authenticated)/tpo/reports/branch-season/loading.tsx");
  const note=source("docs/audit/ux/tpo-reports-branch-season.md");
  expect(page).not.toContain("text-primary-text focus-visible:outline-none");
  expect(page).not.toMatch(/\bmin-h-10\b/);
  expect(page).toMatch(/PageHeader|<h1|redirect\(/);
  expect(loading).toMatch(/aria-busy|GracefulPageLoading|role=["']status["']/);
  expect(note).toContain("/tpo/reports/branch-season");
  expect(note).toContain("UX-tpo-reports-branch-season-01");
  if(page.includes("<DataTable"))expect(page).toContain("empty=");
 });
 it("UX-tpo-placements-jobs-jobid-offers-02 preserves bounded shared offer loading and specific screen-reader label",()=>{
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/loading.tsx");
  expect(loading).toContain("GracefulPageLoading");
  expect(loading).toContain('label="Loading offer register"');
 });
 it("UX-tpo-placements-jobs-jobid-offers-offerid-02 preserves bounded specific offer-detail loading",()=>{
  const loading=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/loading.tsx");
  expect(loading).toContain("GracefulPageLoading");
  expect(loading).toContain('label="Loading offer evidence"');
 });
 it("UX-tpo-placements-jobs-jobid-candidate-schedule-02 gives phone readers all schedule fields and explicit empty copy",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx");
  expect(page).toContain('import { DataTable } from "@/components/ui/data-table"');
  expect(page).toContain('<DataTable');
  expect(page).toContain('caption="Candidate schedule"');
  expect(page).toContain('empty={<EmptyState title="No progression-eligible round participants are currently recorded.');
  expect(page).toContain('mobilePriority:"primary"');
  expect((page.match(/mobilePriority:"secondary"/g)??[])).toHaveLength(5);
  for(const header of ["Candidate","Round","Shared start (IST)","Round venue","Candidate slot","Panel"])
   expect(page).toContain('header:"'+header+'"');
 });
 it("UX-tpo-reports-after-college-02 keeps six report columns on phone and explicit filtered-empty wording",()=>{
  const page=source("src/app/(authenticated)/tpo/reports/after-college/page.tsx");
  expect(page).toContain('import {DataTable} from "@/components/ui/data-table"');
  expect(page).toContain("rows={data.rows.slice((page-1)*25,page*25)}");
  expect(page).toContain('<Pagination page={page} pageCount={pageCount} hrefForPage={pageHref}');
  expect(page).toContain("Math.min(data.rows.length,300)");
  expect(page).toContain("Showing the first 300 rows. Download CSV for the complete filtered list.");
  expect(page).toContain('empty={<EmptyState title="No students match these filters."');
  expect((page.match(/mobilePriority:"secondary"/g)??[])).toHaveLength(5);
  for(const header of ["Student","Roll no.","Batch","Branch","After college","Applications"])
   expect(page).toContain('header:"'+header+'"');
 });
 it("UX-tpo-reports-branch-season-02 preserves eight report fields and exact no-evidence copy on responsive cards",()=>{
  const report=source("src/app/(authenticated)/tpo/reports/branch-season/page.tsx");
  expect(report).toContain('import { DataTable } from "@/components/ui/data-table"');
  expect(report).toContain('<DataTable');
  expect(report).toContain('caption="Branch by placement season"');
  expect(report).toContain('mobilePriority:"primary"');
  expect((report.match(/mobilePriority:"secondary"/g)??[])).toHaveLength(7);
  for(const column of ["Current branch","Applicants","Accepted learners","Accepted offer versions",
   "Accepted / applicants","Registered pool","Accepted registered learners","Placed / registered"])
    expect(report).toContain('header:"'+column+'"');
  expect(report).toContain('empty={<EmptyState title="This season has no persisted applicant, accepted-offer or registered-pool branch evidence.');
  expect(report).toContain('row.acceptedPerApplicantPercent.toFixed(2)+"%"');
  expect(report).toContain('row.placedPerRegisteredPercent.toFixed(2)+"%"');
  expect(report).toContain('row.registered??"Unknown"');
  expect(report).toContain('row.registeredPlaced??"Unknown"');
  expect(report).not.toContain('min-w-[66rem]');
 });

 it("UX-tpo-reports-accreditation-02 renders both eleven-field and six-field tables as cards without losing the authoritative export",()=>{
  const page=source("src/app/(authenticated)/tpo/reports/accreditation/page.tsx");
  expect(page).toContain('import { DataTable } from "@/components/ui/data-table"');
  expect((page.match(/<DataTable/g)??[])).toHaveLength(2);
  expect(page).toContain('caption="Placed students in this batch"');
  expect(page).toContain('caption="Accreditation evidence preview"');
  expect((page.match(/mobilePriority:"primary"/g)??[])).toHaveLength(2);
  expect((page.match(/mobilePriority:"secondary"/g)??[])).toHaveLength(15);
  expect(page).toContain('empty={<EmptyState title="No placed students were recorded in this batch."');
  expect(page).toContain('empty={<EmptyState title="No reportable placement season was found.');
  expect(page).toContain("accreditationPackageLpa(student.packageInr)");
  expect(page).toContain("accreditationOfferStatusLabel(student.offerStatus)");
  expect(page).toContain("accreditationJoiningLabel(student.joining)");
  expect(page).toContain("studentReport.rows.slice(0,50)");
  expect(page).toContain("overview.slice(0,50)");
  expect(page).not.toContain("min-w-[52rem]");
  expect(page).not.toContain("min-w-[46rem]");
 });

 it("UX-tpo-recruiters-leadid-02 uses shared bounded loading without a nested main and maintains route-specific status",()=>{
  const loading=source("src/app/(authenticated)/tpo/recruiters/[leadId]/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-leadid.md");
  expect(loading).toContain("GracefulPageLoading");
  expect(loading).toContain("label=\"Loading recruiter lead details\"");
  expect(loading).not.toContain("<main");
  expect(note).toContain("UX-tpo-recruiters-leadid-02");
 });

 it("UX-tpo-recruiters-campaigns-batchid-02 uses shared bounded loading without a nested main and maintains route-specific status",()=>{
  const loading=source("src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-campaigns-batchid.md");
  expect(loading).toContain("GracefulPageLoading");
  expect(loading).toContain("label=\"Loading campaign delivery batch\"");
  expect(loading).not.toContain("<main");
  expect(note).toContain("UX-tpo-recruiters-campaigns-batchid-02");
 });

 it("UX-tpo-recruiters-campaigns-drafts-campaignid-02 uses shared bounded loading without a nested main and maintains route-specific status",()=>{
  const loading=source("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/loading.tsx");
  const note=source("docs/audit/ux/tpo-recruiters-campaigns-drafts-campaignid.md");
  expect(loading).toContain("GracefulPageLoading");
  expect(loading).toContain("label=\"Loading campaign draft\"");
  expect(loading).not.toContain("<main");
  expect(note).toContain("UX-tpo-recruiters-campaigns-drafts-campaignid-02");
 });
});
