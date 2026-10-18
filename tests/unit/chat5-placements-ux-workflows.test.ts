import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=(path:string)=>readFileSync(path,"utf8");
const root="src/app/(authenticated)/tpo/placements/jobs/[jobId]";
const selection=source("src/components/placements/tpo-drive-selection-manager.tsx");
const waiting=source("src/components/placements/tpo-waitlist-promotion-control.tsx");

describe("chat-5 placement selection accessibility and recovery",()=>{
 it("UX-placements-scroll-motion-01 names and cues scrollable results while trapping overscroll",()=>{
  expect(selection).toMatch(/<fieldset[^>]*overflow-auto overscroll-contain[^>]*mask-image:/);
  expect(selection).toMatch(/tabIndex=\{0\} aria-label="Selection release results, scroll for more"/);
  expect(selection).toMatch(/max-h-32 min-h-0 overflow-auto overscroll-contain[^>]*mask-image:/);
  expect(selection).not.toMatch(/duration-\d+|transition-all/);
 });
 it("UX-placements-selection-targets-01 keeps Select matching and Clear selection 44px tall",()=>{
  for(const label of ["Select matching (max 100)","Clear selection"]){
   const start=selection.lastIndexOf("<button",selection.indexOf(label));
   expect(start).toBeGreaterThanOrEqual(0);
   expect(selection.slice(start,selection.indexOf(">",start))).toContain("min-h-11");
  }
  expect(selection).toContain('empty={<p role="status">No selections yet.</p>}');
  expect(selection).toContain("mobilePriority:\"primary\"");
 });
 it("PLACEMENTS-SELECTION-ERROR-01 masks raw API codes and retains chosen selections on failure",()=>{
  expect(selection).not.toMatch(/throw Error\(payload\?\.issues|throw Error\(payload\?\.error/);
  expect(selection).toContain("Your selected students are preserved");
  expect(selection).toContain("Selections changed while you were reviewing");
  expect(selection).toContain("if(!mode||!chosen.length||pending)return");
  expect(selection).toContain("setChosen([])");
  expect(selection).toContain("expectedRecordedAt");
  expect(selection).toContain("<ConfirmDialog");
  expect(selection).toContain("pending={pending}");
 });
 it("UX-tpo-placements-jobs-jobid-selections-02 protects release permissions and readiness",()=>{
  const page=source(root+"/selections/page.tsx");
  expect(page).toContain('hasMembershipRole(context,"TPO")');
  expect(page).toContain("getTpoSelectionWorkspace(context,jobId)");
  expect(page).toContain("data.job.status!==\"PUBLISHED\"");
  expect(page).toContain("!data.storageReady");
  expect(page).toContain("TpoDriveSelectionManager");
  expect(page).toContain("TpoSelectionImport");
  expect(page.match(/inline-flex min-h-11 items-center/g)?.length).toBeGreaterThanOrEqual(2);
 });
 it("UX-tpo-placements-jobs-jobid-waitlist-02 protects ranked release",()=>{
  const page=source(root+"/waitlist/page.tsx");
  expect(page).toContain('hasMembershipRole(context,"TPO")');
  expect(page).toContain("getTpoWaitlistPreview(context,jobId)");
  expect(page).toContain("TpoWaitlistPromotionControl");
  expect(page.match(/inline-flex min-h-11 items-center/g)?.length).toBeGreaterThanOrEqual(2);
  expect(waiting).toContain("expectedPreviewToken:preview.previewToken");
  expect(waiting).toContain("confirmed:true");
  expect(waiting).toContain('empty={<p role="status">No applied waitlist results in the final round.</p>}');
  expect(waiting).toContain("<ConfirmDialog");
 });
 it("UX-tpo-placements-jobs-jobid-offers-02 binds export to validated filters and ownership",()=>{
  const page=source(root+"/offers/page.tsx");
  expect(page).toContain('hasMembershipRole(context,"TPO")');
  expect(page).toContain("offerRegisterQuery.safeParse");
  expect(page).toContain("getTpoDriveOfferRegister(context,parsed.data)");
  expect(page).toContain("new URLSearchParams");
  expect(page).toContain("csvFilters.set");
  expect(page).toContain("No offers match this filter.");
  expect(page).toContain('aria-label="Offer register pages"');
  expect(page).toContain("inline-flex min-h-11 items-center");
 });
 it("UX-tpo-placements-jobs-jobid-offers-offerid-02 never infers employer acceptance from letter delivery",()=>{
  const page=source(root+"/offers/[offerId]/page.tsx");
  expect(page).toContain('hasMembershipRole(context,"TPO")');
  expect(page).toContain("tpoOfferEvidenceQuery.safeParse");
  expect(page).toContain("getTpoOfferEvidence(context,parsed.data)");
  expect(page).toContain("No persisted status or joining history events");
  expect(page).toContain("This page does not verify letter delivery");
  expect(page).toContain("inline-flex min-h-11 items-center");
 });
 it("PLACEMENTS-JOINING-CONFIRM-01 does not mutate before confirmation, and retains corrected draft",()=>{
  const form=source("src/components/placements/tpo-joining-update-form.tsx");
  const gate=form.indexOf("if (!confirmed)");
  const mutation=form.indexOf("await fetch(");
  expect(gate).toBeGreaterThan(0);
  expect(mutation).toBeGreaterThan(gate);
  expect(form).toContain("setConfirmOpen(true)");
  expect(form).toContain("onConfirm={()=>void save(true)}");
  expect(form).toContain("onOpenChange={setConfirmOpen}");
  expect(form).toContain("correctionReason: corrected ? correctionReason.trim() : null");
  expect(form).toContain('method: "PUT"');
  expect(form).toContain("if (busy) return");
 });
 it("UX-placements-bulk-round-targets-01 makes mass-selection a full touch target",()=>{
  const bulk=source("src/components/placements/tpo-bulk-round-result-recorder.tsx");
  expect(bulk).toContain('className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)]">Select first 25 unmarked');
  expect(bulk).toContain("pendingTotal > 25");
  expect(bulk).toContain("if(!confirmed){setConfirmOpen(true);return;}");
 });
 it("UX-tpo-placements-jobs-jobid-joining-02 records only scoped accepted offers, not guessed joins",()=>{
  const page=source(root+"/joining/page.tsx");
  expect(page).toContain('hasMembershipRole(context, "TPO")');
  expect(page).toContain("tpoJoiningTrackerQuerySchema.safeParse");
  expect(page).toContain("getTpoJoiningTracker(context, parsed.data)");
  expect(page).toContain("No currently accepted offers are recorded for this drive");
  expect(page).toContain("No joining is inferred from the planned joining date alone");
  expect(page).toContain("TpoJoiningUpdateForm");
  expect(page).toContain("inline-flex min-h-11 items-center");
 });
 it("UX-tpo-placements-jobs-jobid-rounds-roundid-results-02 filters before loading learner data",()=>{
  const page=source(root+"/rounds/[roundId]/results/page.tsx");
  expect(page).toContain('hasMembershipRole(context,"TPO")');
  expect(page).toContain("tpoRoundResultViewSchema.safeParse");
  expect(page).toContain("Invalid round result filters. No learner data loaded.");
  expect(page).toContain("Bulk staging is unavailable when the eligible roster exceeds 500");
  expect(page).toContain("TpoRoundApplyControl");
  expect(page).toContain("No eligible shortlisted submitted applicants");
  expect(page).toContain("inline-flex min-h-11 items-center");
 });
});

describe("chat-5: report mobile overlay scroll",()=>{
 it("UX-PLACEMENTS-REPORT-SCROLL-27 exposes keyboard, cue and safe-area for both report pickers",()=>{
  const markup=source("src/components/placements/report-interactive-table.tsx");
  expect(markup).toContain('aria-label="Report column filters, scroll for more"');
  expect(markup).toContain('aria-label="Report columns, scroll for more"');
  expect(markup.split("overscroll-contain").length-1).toBeGreaterThanOrEqual(2);
  expect(markup.split("mask-image:linear-gradient(to_bottom").length-1).toBeGreaterThanOrEqual(2);
  expect(markup.split("tabIndex={0}").length-1).toBeGreaterThanOrEqual(2);
  expect(markup).toContain("safe-area-inset-bottom");
  expect(markup).toContain('disclosure?.querySelector("summary")?.focus()');
  expect(markup).toContain("<DataTable");
 });
});
