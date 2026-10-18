import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("UX admin scroll and motion after invisible scrollbar owner decision",()=>{
 it("UX-admin-scroll-motion-01 desktop DataTable shows horizontal cue and keyboard region (src/components/ui/data-table.tsx)",()=>{
  const code=source("src/components/ui/data-table.tsx");
  expect(code).toContain("Scroll sideways for more columns");
  expect(code).toContain("sm:overscroll-x-contain");
  expect(code).toContain("role=\"region\"");
  expect(code).toContain("tabIndex={0}");
  expect(code).toContain("[mask-image:linear-gradient");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-02 native Dialog keeps one masked overflow body and fixed header footer (src/components/ui/dialog.tsx)",()=>{
  const code=source("src/components/ui/dialog.tsx");
  expect(code).toContain("flex-1 overflow-y-auto overscroll-contain");
  expect(code).toContain("overflow-hidden");
  expect(code).toContain("[mask-image:linear-gradient");
  expect(code).toContain("env(safe-area-inset-bottom)");
  expect(code).toContain("availableHeight");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-03 native Drawer avoids nested scroll and scrolls within visual viewport (src/components/ui/drawer.tsx)",()=>{
  const code=source("src/components/ui/drawer.tsx");
  expect(code).toContain("flex h-full min-h-0 flex-col overflow-hidden");
  expect(code).toContain("overflow-y-auto overscroll-contain");
  expect(code).toContain("[mask-image:linear-gradient");
  expect(code).toContain("availableHeight");
  expect(code).toContain("env(safe-area-inset-bottom)");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-04 BottomSheet scrolls once inside safe-area constrained content (src/components/ui/bottom-sheet.tsx)",()=>{
  const code=source("src/components/ui/bottom-sheet.tsx");
  expect(code).toContain("overflow-hidden");
  expect(code).toContain("overflow-y-auto overscroll-contain");
  expect(code).toContain("[mask-image:linear-gradient");
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
  expect(code).toContain("tabIndex={0}");
  expect(code).toContain("overflow-y-auto overscroll-contain");
  expect(code).toContain("[mask-image:linear-gradient");
  expect(code).toContain("max-h-[65dvh]");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-07 placement calendar wide grid has horizontal overscroll isolation and fade (src/components/placements/placement-calendar-workspace.tsx)",()=>{
  const code=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(code).toContain("overflow-x-auto overscroll-x-contain");
  expect(code).toContain("[mask-image:linear-gradient(to_right");
  expect(code).toContain("min-w-[56rem]");
  expect(code).toContain("tabIndex={0}");
  expect(code).not.toContain("transition-all");
 });
 it("UX-admin-scroll-motion-08 inbound-mail Drawer uses the audited native body with guarded status and accessible message (src/components/admin/inbound-mail-list.tsx)",()=>{
  const code=source("src/components/admin/inbound-mail-list.tsx");
  expect(code).toContain("<Drawer open");
  expect(code).toContain("onOpenChange=");
  expect(code).toContain("title={selected.subject");
  expect(code).toContain("disabled={busy}");
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
  expect(code).toContain("role=\"alert\"");
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
  expect(css).toContain("--lms-motion-base: 200ms");
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

});
