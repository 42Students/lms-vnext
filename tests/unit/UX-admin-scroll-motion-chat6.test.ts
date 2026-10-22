import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("UX admin scroll and motion after invisible scrollbar owner decision",()=>{
 it("UX-admin-scroll-motion-01 DataTable delegates adaptive horizontal fades and keyboard focus to ScrollCue (src/components/ui/data-table.tsx)",()=>{
  const code=source("src/components/ui/data-table.tsx");
  expect(code).toContain("<ScrollCue axis=\"x\"");
  expect(code).toContain("Scrollable table columns");
  expect(code).toContain("md:rounded-[var(--lms-radius-md)]");
  expect(code).toContain("<table");
  expect(code).toContain("More details");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-02 Dialog delegates one scrollable content pane and sticky header footer to ScrollCue (src/components/ui/dialog.tsx)",()=>{
  const code=source("src/components/ui/dialog.tsx");
  expect(code).toContain("<ScrollCue axis=\"y\"");
  expect(code).toContain("dialog content");
  expect(code).toContain("overflow-hidden");
  expect(code).toContain("env(safe-area-inset-bottom)");
  expect(code).toContain("availableHeight");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-03 Drawer preserves one visual viewport scroller and focus return (src/components/ui/drawer.tsx)",()=>{
  const code=source("src/components/ui/drawer.tsx");
  expect(code).toContain("<ScrollCue axis=\"y\"");
  expect(code).toContain("drawer content");
  expect(code).toContain("flex h-full [min-height:0] flex-col overflow-hidden");
  expect(code).toContain("availableHeight");
  expect(code).toContain("env(safe-area-inset-bottom)");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-04 BottomSheet delegates focusable vertical scrolling to adaptive ScrollCue (src/components/ui/bottom-sheet.tsx)",()=>{
  const code=source("src/components/ui/bottom-sheet.tsx");
  expect(code).toContain("<ScrollCue axis=\"y\"");
  expect(code).toContain("sheet content");
  expect(code).toContain("overflow-hidden");
  expect(code).toContain("availableHeight");
  expect(code).toContain("safe-area-inset-bottom");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-05 bulk drive selection shows scroll hint for longer bounded lists (src/components/placements/super-admin-bulk-drive-actions.tsx)",()=>{
  const code=source("src/components/placements/super-admin-bulk-drive-actions.tsx");
  expect(code).toContain("eligible.length>3");
  expect(code).toContain("More drives below");
  expect(code).toContain("overflow-y-auto overscroll-contain");
  expect(code).toContain("role=\"region\"");
  expect(code).toContain("aria-describedby={eligible.length>3");
  expect(code).toContain("[mask-image:linear-gradient");
  expect(code).not.toContain("overflow-auto");
 });
 it("UX-admin-scroll-motion-06 drive action menu has vertical fade, focusable bounded region and narrow-phone hint (src/components/placements/placement-drive-workspace.tsx)",()=>{
  const code=source("src/components/placements/placement-drive-workspace.tsx");
  expect(code).toContain("Scroll for more drive actions");
  expect(code).toContain('aria-label="Drive action choices"');
  expect(code).toContain("tabIndex={0}");
  expect(code).toContain('role="group"');
  expect(code).toContain("overflow-y-auto overscroll-contain");
  expect(code).toContain("[mask-image:linear-gradient");
  expect(code).toContain("max-h-[65dvh]");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-07 placement calendar wide grid has horizontal overscroll isolation and fade (src/components/placements/placement-calendar-workspace.tsx)",()=>{
  const code=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(code).toContain("overflow-x-auto overscroll-x-contain");
  expect(code).toContain("[mask-image:linear-gradient(to_right");
  expect(code).toContain("min-[992px]:min-w-[56rem]");
  expect(code).toContain("min-w-[42rem]");
  expect(code).toContain("tabIndex={0}");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-08 inbound-mail Drawer uses the audited native body with guarded status and accessible message (src/components/admin/inbound-mail-list.tsx)",()=>{
  const code=source("src/components/admin/inbound-mail-list.tsx");
  expect(code).toContain("<Drawer open");
  expect(code).toContain("onOpenChange=");
  expect(code).toContain("title={selected.subject");
  expect(code).toContain("disabled={busy||detailLoading||!detail}");
  expect(code).toContain("Plain text message");
  expect(code).not.toContain("<dialog");
 });
 it("UX-admin-scroll-motion-09 lecture-hall editor and archive confirm inherit native overlay scroll and motion (src/components/admin/lecture-hall-manager.tsx)",()=>{
  const code=source("src/components/admin/lecture-hall-manager.tsx");
  expect(code).toContain("<Dialog");
  expect(code).toContain("<ConfirmDialog");
  expect(code).toContain("onOpenChange");
  expect(code).toContain("<DataTable");
  expect(code).not.toContain("window.confirm");
 });
 it("UX-admin-scroll-motion-10 organization rename and archive keep native overlay focus and consequence (src/components/admin/organization-actions.tsx)",()=>{
  const code=source("src/components/admin/organization-actions.tsx");
  expect(code).toContain("<Dialog");
  expect(code).toContain("<ConfirmDialog");
  expect(code).toContain("onOpenChange");
  expect(code).toContain("onConfirm=");
  expect(code).not.toContain("window.confirm");
 });
 it("UX-admin-scroll-motion-11 membership and profile edits use shared modal rather than hidden custom scrollers (src/components/admin/person-membership-actions.tsx)",()=>{
  const code=source("src/components/admin/person-membership-actions.tsx");
  expect(code).toContain("<Dialog");
  expect(code).toContain("<ConfirmDialog");
  expect(code).toContain("onOpenChange");
  expect(code).toContain("<PersonProfileDialog");
  expect(code).not.toContain("<dialog");
 });
 it("UX-admin-scroll-motion-12 person onboard uses shared Dialog for validation and keyboard escape (src/components/admin/person-onboard-dialog.tsx)",()=>{
  const code=source("src/components/admin/person-onboard-dialog.tsx");
  expect(code).toContain("<Dialog");
  expect(code).toContain("onOpenChange");
  expect(code).toContain("<");
  expect(code).not.toContain("<dialog");
 });
 it("UX-admin-scroll-motion-13 profile editing uses shared Dialog and retains failure status (src/components/admin/person-profile-dialog.tsx)",()=>{
  const code=source("src/components/admin/person-profile-dialog.tsx");
  expect(code).toContain("<Dialog");
  expect(code).toContain("onOpenChange");
  expect(code).toContain("showToast({");
  expect(code).toContain('tone: "error"');
  expect(code).not.toContain("<dialog");
 });
 it("UX-admin-scroll-motion-14 interview scheduling overlay keeps modal and confirm semantics (src/components/placements/college-interview-appointments.tsx)",()=>{
  const code=source("src/components/placements/college-interview-appointments.tsx");
  expect(code).toContain("<Dialog");
  expect(code).toContain("dismissible={!busy}");
  expect(code).toContain("<ConfirmDialog");
  expect(code).toContain("<DataTable");
  expect(code).not.toContain("window.confirm");
 });
 it("UX-admin-scroll-motion-15 uses motion tokens and global reduced-motion and hidden-scrollbar rules",()=>{
  const css=source("src/app/globals.css");
  expect(css).toContain("--lms-motion-fast: 150ms");
  expect(css).toContain("--lms-motion-base: 250ms");
  expect(css).toContain("var(--lms-motion-ease)");
  expect(css).toContain("prefers-reduced-motion: reduce");
  expect(css).toContain("scrollbar-width: none");
  expect(css).toContain("::-webkit-scrollbar");
 });
 it("UX-admin-scroll-motion-16 bulk drive archive confirmation uses accessible native dialog and action lock",()=>{
  const code=source("src/components/placements/super-admin-bulk-drive-actions.tsx");
  expect(code).toContain("<ConfirmDialog");
  expect(code).toContain('title={"Confirm "+action.toLowerCase()');
  expect(code).toContain("inFlightRef.current=true");
  expect(code).toContain("inFlightRef.current=false");
  expect(code).not.toContain("window.confirm");
 });
 it("UX-admin-scroll-motion-17 application pipeline uses responsive DataTable and scroll-visible outcomes",()=>{
  const code=source("src/components/placements/college-application-pipeline-controls.tsx");
  expect(code).toContain('caption="Applications pipeline"');
  expect(code).toContain('mobilePriority:"primary"');
  expect(code).toContain('mobilePriority:"action"');
  expect(code).toContain("More selected learners below");
  expect(code).toContain("More outcomes below");
  expect(code).toContain("overscroll-contain");
  expect(code).toContain("No applications match these filters.");
  expect(code).not.toContain("<table");
  expect(code).not.toContain("overflow-x-auto");
 });

 it("UX-admin-scroll-motion-18 all changed scrollers use global motion defaults rather than hard-coded or layout animations",()=>{
  for(const file of [
    "src/components/ui/data-table.tsx",
    "src/components/ui/dialog.tsx",
    "src/components/ui/drawer.tsx",
    "src/components/ui/bottom-sheet.tsx",
    "src/components/placements/super-admin-bulk-drive-actions.tsx",
    "src/components/placements/placement-drive-workspace.tsx",
    "src/components/placements/placement-calendar-workspace.tsx",
    "src/components/placements/college-application-pipeline-controls.tsx",
  ]){
    const code=source(file);
    expect(code,file).not.toMatch(/duration-\d+|transition-all|animate-\[|transition-\[(?:width|height|top|left)/);
  }
 });

 it("UX-admin-scroll-motion-19 ScrollCue dynamically announces scrollable regions and shows non-blocking edge fades",()=>{
  const cue=source("src/components/ui/scroll-cue.tsx");
  expect(cue).toContain("ResizeObserver");
  expect(cue).toContain("MutationObserver");
  expect(cue).toContain("node.addEventListener");
  expect(cue).toContain("scrollable: max > 2");
  expect(cue).toContain('role={edges.scrollable ? "region" : undefined}');
  expect(cue).toContain("tabIndex={edges.scrollable ? 0 : -1}");
  expect(cue).toContain('data-scroll-fade="start"');
  expect(cue).toContain('data-scroll-fade="end"');
  expect(cue).toContain("pointer-events-none");
  expect(cue).toContain("overscroll-contain");
 });

 it("UX-admin-scroll-motion-20 application notes Drawer scroll is labelled, masked and keyboard reachable",()=>{
  const code=source("src/components/placements/college-application-detail-drawer.tsx");
  expect(code).toContain('title="Application Details"');
  expect(code).toContain("More internal notes below");
  expect(code).toContain('aria-label="Internal notes history"');
  expect(code).toContain("tabIndex={detail.notes.length>3?0:undefined}");
  expect(code).toContain("overflow-y-auto overscroll-contain");
  expect(code).toContain("[mask-image:linear-gradient");
  expect(code).not.toContain("max-h-48 space-y-2 overflow-auto");
 });
 it("UX-admin-scroll-motion-21 duplicate-drive confirmation preserves consequence, 44px action and pending guard",()=>{
  const code=source("src/components/placements/super-admin-drive-duplicate.tsx");
  expect(code).toContain("<ConfirmDialog open={confirmOpen}");
  expect(code).toContain("Dates, applications, interview rounds, offers, and candidate decisions will not be copied.");
  expect(code).toContain("min-h-11");
  expect(code).toContain("inFlightRef.current=true");
  expect(code).toContain("inFlightRef.current=false");
  expect(code).not.toContain("window.confirm");
  expect(code).not.toContain("result?.error");
 });
 it("UX-admin-scroll-motion-22 deadline confirmation keeps form values and blocks duplicate writes",()=>{
  const code=source("src/components/placements/super-admin-drive-deadline.tsx");
  expect(code).toContain("<form onSubmit={review}");
  expect(code).toContain("<ConfirmDialog open={pendingIso!==null}");
  expect(code).toContain("Extend the published application deadline? This affects when students can apply.");
  expect(code).toContain("inFlightRef.current=true");
  expect(code).toContain("inFlightRef.current=false");
  expect(code).toContain('<Input name="deadline" type="datetime-local" required');
  expect(code).toContain('aria-invalid={Boolean(error)}');
  expect(code).not.toContain("window.confirm");
  expect(code).not.toContain("data?.error");
 });

});
