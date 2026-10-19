import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 SHELL_NAV_ICON_KEYS,SHELL_SECTION_LABELS,TPO_SECTION_LABELS,superAdminItems,collegeAdminItems,
 shellNavIconKey,scopedShellNavigation,type ShellNavItem,
} from "@/components/shell/shell-model";

const source=(path:string)=>readFileSync(path,"utf8");
const faculty:ShellNavItem={
 href:"/teacher/courses",label:"Courses",shortLabel:"C",group:"learning",
};
const tpo:ShellNavItem={
 href:"/tpo/home",label:"Home",shortLabel:"H",group:"operate",
};
const college:ShellNavItem={
 href:"/college",label:"Dashboard",shortLabel:"D",group:"operate",
};

describe("NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons",()=>{
 it("gives every Super Admin and College Admin row a real SVG icon instead of a letter block",()=>{
  for(const row of [...superAdminItems,...collegeAdminItems]){
   expect(SHELL_NAV_ICON_KEYS[row.href]).toBeTruthy();
   expect(shellNavIconKey(row)).not.toBe("layers");
  }
 });
 it("keeps Faculty and TPO navigation separate for an overlapping multi-role membership",()=>{
  const both=[faculty,tpo,college];
  expect(scopedShellNavigation(both,"/teacher/courses").map(row=>row.href))
   .toEqual(["/teacher/courses","/college"]);
  expect(scopedShellNavigation(both,"/tpo/home").map(row=>row.href))
   .toEqual(["/tpo/home","/college"]);
  expect(scopedShellNavigation([faculty,college],"/teacher/courses"))
   .toEqual([faculty,college]);
 });
 it("isolates secondary legacy portals even when they have one menu row",()=>{
  const learner:ShellNavItem={href:"/learn/courses",label:"Courses",shortLabel:"C"};
  const mentor:ShellNavItem={href:"/mentor/projects",label:"Projects",shortLabel:"P"};
  expect(scopedShellNavigation([learner,mentor],"/learn/courses")).toEqual([learner]);
  expect(scopedShellNavigation([learner,mentor],"/mentor/projects")).toEqual([mentor]);
  const collegeMore:ShellNavItem={href:"/college/courses",label:"College Courses",shortLabel:"C"};
  expect(scopedShellNavigation([college,collegeMore,faculty],"/teacher/courses")).toEqual([faculty]);
  expect(scopedShellNavigation([college,collegeMore,faculty],"/college/courses")).toEqual([college,collegeMore]);
 });
 it("restores the exact unqualified legacy labels after role filtering",()=>{
  const items:ShellNavItem[]=[
   {href:"/learn/courses",label:"Courses · Learning",shortLabel:"C"},
   {href:"/teacher/courses",label:"Courses · Teaching",shortLabel:"C"},
  ];
  expect(scopedShellNavigation(items,"/teacher/courses")).toEqual([
   {href:"/teacher/courses",label:"Courses",shortLabel:"C"},
  ]);
  expect(scopedShellNavigation(items,"/learn/courses")).toEqual([
   {href:"/learn/courses",label:"Courses",shortLabel:"C"},
  ]);
 });
 it("keeps visible group headings exclusive to TPO and hairlines elsewhere",()=>{
  const nav=source("src/components/shell/sidebar-nav.tsx");
  const css=source("src/components/shell/sidebar-legacy.css");
  expect(nav).toContain('!item.href.startsWith("/tpo/")');
  expect(nav).toContain('className="lms-nav-group-rule"');
  expect(css).toContain(".lms-nav-group-rule");
  expect(TPO_SECTION_LABELS.operate).toBe("Operate");
  expect(TPO_SECTION_LABELS.administration).toBe("Administration");
 });
 it("keeps the original recruiter and TPO icon identities",()=>{
  expect(SHELL_NAV_ICON_KEYS["/hr/home"]).toBe("dashboard");
  expect(SHELL_NAV_ICON_KEYS["/hr/company"]).toBe("users");
  expect(SHELL_NAV_ICON_KEYS["/tpo/requests"]).toBe("check-circle");
  expect(SHELL_NAV_ICON_KEYS["/tpo/reports"]).toBe("file-text");
  expect(SHELL_NAV_ICON_KEYS["/tpo/settings"]).toBe("wrench");
 });
 it("shows one active workspace for multi-role memberships without mixing all portal rows",()=>{
  const learn:ShellNavItem={href:"/learn/courses",label:"Courses",shortLabel:"C",group:"learning"};
  const mentor:ShellNavItem={href:"/mentor/projects",label:"Projects",shortLabel:"P",group:"learning"};
  const teacherMore:ShellNavItem={href:"/teacher/calendar",label:"Class Schedule",shortLabel:"S",group:"tracking"};
  const learnMore:ShellNavItem={href:"/learn/attendance",label:"Attendance",shortLabel:"A",group:"tracking"};
  const combined=[learn,learnMore,faculty,teacherMore,mentor,college];
  expect(scopedShellNavigation(combined,"/teacher/courses").map(item=>item.href))
   .toEqual(["/teacher/courses","/teacher/calendar","/college"]);
  expect(scopedShellNavigation(combined,"/learn/attendance").map(item=>item.href))
   .toEqual(["/learn/courses","/learn/attendance","/college"]);
  // College Admin's legacy Placement cell access is not a second full TPO account.
  expect(scopedShellNavigation([college,{
   href:"/college/courses",label:"Courses",shortLabel:"C"
  },{href:"/tpo/home",label:"Placement cell",shortLabel:"P"}],"/college"))
   .toHaveLength(3);
 });
 it("preserves legacy group names and all distinct route/icon choices",()=>{
  expect(SHELL_SECTION_LABELS.operate).toBe("Operate");
  expect(SHELL_SECTION_LABELS.coordinate).toBe("Coordinate");
  expect(SHELL_SECTION_LABELS.insights).toBe("Insights");
  expect(SHELL_SECTION_LABELS.administration).toBe("Administration");
  for(const route of ["/tpo/requests","/tpo/verification","/tpo/messages",
   "/hr/home","/hr/drives","/hr/calendar","/hr/conversations","/hr/company",
   "/teacher/contacts/allContacts","/learn/courses"]){
   expect(SHELL_NAV_ICON_KEYS[route],route).toBeTruthy();
  }
 });
 it("follows exactly the old measured rail transition and active/hover colors",()=>{
  const css=source("src/components/shell/sidebar-legacy.css");
  expect(css).toContain("width:96px;");
  expect(css).toContain("width:256px;");
  expect(css).toContain("padding-left:96px");
  expect(css).toContain("padding-left:256px");
  expect(css).toContain("width .15s cubic-bezier(.2,0,0,1)");
  expect(css).toContain(".lms-desktop-sidebar:is(:hover,:focus-within)");
  expect(css).toContain("background:#eff8fa");
  expect(css).toContain("box-shadow:inset 3px 0 #26bac7");
  expect(css).toContain("color:#1a95a1");
  expect(css).toContain("background:rgba(38,186,199,.07)");
  expect(css).toContain("font-size:15px");
  expect(css).toContain("scrollbar-width:none");
  expect(css).toContain("transform:scale(.72)");
 });
 it("uses the legacy thin TPO scrollbar only on expanded rails",()=>{
  const css=source("src/components/shell/sidebar-legacy.css");
  const nav=source("src/components/shell/sidebar-nav.tsx");
  expect(nav).toContain("data-sidebar-portal={sidebarPortal}");
  expect(css).toContain('.lms-sidebar-nav[data-sidebar-portal="tpo"]');
  expect(css).toContain("scrollbar-width:thin;");
  expect(css).toContain("width:4px;");
  expect(css).toContain("scrollbar-color:rgba(107,114,128,.28) transparent;");
  expect(css).toContain("line-height:1;");
  expect(css).toContain(".lms-sidebar-item-icon svg {display:block;width:20px;height:20px;}");
 });
 it("hides expanded headings and labels in collapsed desktop mode, keeps mobile labels",()=>{
  const css=source("src/components/shell/sidebar-legacy.css");
  expect(css).toContain(".lms-nav-heading::after");
  expect(css).toContain(".lms-nav-heading-text");
  expect(css).toContain(".lms-nav-label");
  expect(css).toContain("visibility:hidden");
  expect(css).toContain("visibility:visible");
  expect(css).toContain("@media (min-width:768px)");
  const nav=source("src/components/shell/sidebar-nav.tsx");
  expect(nav).toContain("scopedShellNavigation(items,pathname)");
  expect(nav).toContain('aria-label={badge&&count!==null?');
  expect(nav).toContain('${item.label}, ${count} pending');
  expect(nav).toContain("ShellNavGlyph");
  expect(nav).toContain("lms-sidebar-badge");
  expect(nav).toContain("legacySidebarItemActive");
 });
 it("uses the exact historic 42LMS logomark and preserves the mobile focus-trapped drawer",()=>{
  const icon=source("src/components/shell/shell-nav-icons.tsx");
  expect(icon).toContain('fill="#266891"');
  expect(icon).toContain('fill="#9EE4E8"');
  expect(icon).toContain('fill="#26BAC7"');
  expect(icon).toContain("viewBox=\"0 0 41 38\"");
  const app=source("src/components/shell/app-shell.tsx");
  expect(app).toContain('data-slot="legacy-sidebar"');
  expect(app).toContain('className="lms-shell-page min-h-dvh"');
  expect(app).toContain("<ShellLogoMark />");
  const mobile=source("src/components/shell/mobile-navigation.tsx");
  expect(mobile).toContain("w-[min(16rem,88vw)]");
  expect(mobile).toContain('aria-modal="true"');
  expect(mobile).toContain('event.key === "Escape"');
 });
});
