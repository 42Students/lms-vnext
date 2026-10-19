import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

describe("NORTH-STAR-SIDEBAR-03: measured original icons and mobile group parity",()=>{
 it("uses original pre-existing icon assets even without an active variant",()=>{
  const nav=read("src/components/shell/sidebar-nav.tsx");
  expect(nav).toContain("{item.icon?");
  expect(nav).toContain("active?item.activeIcon??item.icon:item.icon");
  expect(nav).toContain("ShellNavGlyph");
 });
 it("keeps only one expanded-logo rule and clips scroll horizontally",()=>{
  const css=read("src/components/shell/sidebar-legacy.css");
  const selector=".lms-desktop-sidebar:is(:hover,:focus-within) .lms-sidebar-logo-row";
  expect(css.split(selector)).toHaveLength(2);
  expect(css).toContain("overflow-x:hidden");
  expect(css).toContain("scrollbar-width:none");
  expect(css).toContain("width:96px");
  expect(css).toContain("width:256px");
  expect(css).toContain("box-shadow:inset 3px 0 #26bac7");
 });
 it("matches measured 9px mobile headings and preserves the mobile drawer",()=>{
  const css=read("src/components/shell/sidebar-legacy.css");
  const mobile=read("src/components/shell/mobile-navigation.tsx");
  expect(css).toContain("@media (max-width:767px)");
  expect(css).toContain(".lms-mobile-sidebar .lms-nav-heading");
  expect(css).toContain("margin:12px 12px 6px 46px");
  expect(css).toContain("font-size:9px");
  expect(mobile).toContain("lms-mobile-sidebar");
  const drawer=read("src/components/ui/drawer.tsx");
  expect(mobile).toContain('import { Drawer } from "@/components/ui/drawer"');
  expect(drawer).toContain("<dialog ref={ref}");
  expect(drawer).toContain("onCancel={event =>");
 });
 it("announces TPO pending counts even when sidebar labels are visually hidden",()=>{
  const nav=read("src/components/shell/sidebar-nav.tsx");
  expect(nav).toContain("aria-label={badge&&count!==null?");
  expect(nav).toContain("${item.label}, ${count} pending");
  expect(nav).toContain('aria-current={active?"page":undefined}');
 });
});

describe("NORTH-STAR-HR-03: secondary recruiter surfaces inherit page canvas",()=>{
 it("avoids nesting a separate full-panel card around the outside drive form",()=>{
  const form=read("src/components/placements/recorded-outside-form.tsx");
  expect(form).toContain('className="grid gap-4 sm:grid-cols-2"');
  expect(form).not.toContain("grid gap-4 rounded-xl border");
  expect(form).toContain("name=\"collegeId\"");
 });
 it("retains the incoming 36px recruiter bell while enforcing legacy focus and radius",()=>{
  const bell=read("src/components/hr/recruiter-notification-bell.tsx");
  expect(bell).toContain("min-h-9 min-w-9");
  expect(bell).not.toContain("rounded-[9px]");
  expect(bell).not.toContain("focus-visible:outline-primary");
  expect(bell).toContain("rounded-[var(--lms-control-radius)]");
 });
 it("keeps every recruiter operation while using the 9px control token",()=>{
  const paths=[
   "src/components/placements/recruiter-interview-slot-form.tsx",
   "src/components/placements/recruiter-placement-portfolio.tsx",
   "src/components/placements/recruiter-result-controls.tsx",
   "src/components/placements/recruiter-resume-download.tsx",
   "src/components/placements/recorded-outside-form.tsx",
   "src/components/placements/applicant-notes-panel.tsx",
   "src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx",
  ];
  for(const path of paths){
   const source=read(path);
   expect(source,path).not.toContain("rounded-[9px]");
   expect(source,path).not.toContain("focus-visible:outline-primary-text");
  }
  const replies=read("src/app/(authenticated)/hr/conversations/page.tsx");
  expect(replies).toContain('if(!parsed.success)return <div role="alert" className="space-y-3">');
 });
});
