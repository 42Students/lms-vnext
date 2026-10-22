import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const src=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
describe("UX-chat15-scroll-motion-01",()=>{
 it("UX-ui-scroll-cue-01 exposes focus only on real overflow and draws noninteractive edge fades",()=>{
  const s=src("src/components/ui/scroll-cue.tsx");
  for(const part of ["node.scrollWidth - node.clientWidth",
    "node.scrollHeight - node.clientHeight", "ResizeObserver(update)",
    'node.addEventListener("scroll", update, { passive: true })',
    'role={edges.scrollable ? "region" : undefined}',
    "tabIndex={edges.scrollable ? 0 : -1}","overscroll-x-contain",
    "overscroll-contain",'data-scroll-fade="start"','data-scroll-fade="end"',
    "pointer-events-none"])expect(s).toContain(part);
 });
 it("UX-tracker-scroll-motion-01 shared Drawer handles viewport and keyboard scrolling",()=>{
  expect(src("src/components/tracker/tracker-quick-report-launcher.tsx")).toContain("<Drawer open={open}");
  const s=src("src/components/ui/drawer.tsx");
  expect(s).toContain("useOverlayExit(ref, opener, open, 200)");
  expect(src("src/components/ui/use-overlay-exit.ts")).toContain("dialog.showModal()");
  for(const part of ['axis="y"', "min-h-0",
    "safe-area-inset-bottom"])expect(s).toContain(part);
 });
 it("UX-hr-scroll-motion-01 notifications and verification have discoverable overflow",()=>{
  expect(src("src/components/hr/recruiter-notification-bell.tsx")).toContain('<ScrollCue axis="y"');
  const s=src("src/components/verification/VerificationReviewDrawer.tsx");
  expect(s).toContain("<Drawer open={true}");
  const sharedDrawer=src("src/components/ui/drawer.tsx");
  expect(sharedDrawer).toContain("overscroll-contain");
  expect(sharedDrawer).toContain('<ScrollCue axis="y"');
  expect(src("src/components/ui/scroll-cue.tsx")).toContain('data-scroll-fade="start"');
 });
 it("UX-ui-scroll-motion-02 control motion is tokenized and reduced-motion safe",()=>{
  const s=src("src/components/ui/selection-controls.tsx");
  expect(s).toContain("duration-[var(--lms-motion-fast)]");
  expect(s).toContain("ease-[var(--lms-motion-ease)]");
  expect(s).toContain("motion-reduce:transition-none");
  const css=src("src/app/globals.css");
  expect(css).toContain("--lms-motion-fast");
  expect(css).toContain("prefers-reduced-motion");
 });
});
