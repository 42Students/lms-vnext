import {describe,expect,it} from "vitest";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";

const read=(path:string)=>readFileSync(path,"utf8");
const inventory=read("docs/orchestrator/ui-ux/pages-hr.md");
const routes=[...inventory.matchAll(/\((src\/app\/\(authenticated\)\/hr\/[^\n)]+)\)/g)]
 .map(match=>match[1]);
const controls=[
 "rounded-[9px]",
 "focus-visible:outline-primary-text",
 "focus-visible:outline-[var(--lms-link-text)]",
];
describe("NORTH-STAR-CHAT19-POLISH: measured legacy sidebar and HR control tokens",()=>{
 it("matches the legacy collapsed badge position, icon opacity and body/footer spacing",()=>{
  const css=read("src/components/shell/sidebar-legacy.css");
  expect(css).toContain("opacity:.55;");
  expect(css).toContain("top:4px;");
  expect(css).toContain("margin-left:5px;");
  expect(css).toContain("transform:scale(.72);");
  expect(css).toContain("width:96px;");
  expect(css).toContain("width:256px;");
  expect(css).toContain(".lms-shell-frame {display:flex;align-items:stretch;}");
  expect(css).toContain(".lms-shell-page {min-width:0;flex:1 1 0%;}");
  expect(css).not.toContain("padding-left:256px;");
  expect(css).toContain("border-right:1px solid #f1f4f9;");
  expect(css).toContain("box-shadow:inset 3px 0 #26bac7;");
  const shell=read("src/components/shell/app-shell.tsx");
  expect(shell).toContain("lms-sidebar-logo-row");
  expect(shell).toContain("lms-sidebar-scroll min-h-0 flex-1 overflow-y-auto pt-2 pb-4");
  expect(shell).toContain("lms-sidebar-role-details");
  expect(shell).toContain("px-4 py-[25px]");
  expect(shell).toContain("<LegacyTopbar");
 });
 it("shows the drawer only below 768px and avoids a duplicate tablet menu slot",()=>{
  const topbar=read("src/components/shell/topbar/legacy-topbar.tsx");
  const drawer=read("src/components/shell/mobile-navigation.tsx");
  expect(topbar).toContain('className="shrink-0 md:hidden"');
  expect(drawer).toContain("md:hidden");
  const shared=read("src/components/ui/drawer.tsx");
  expect(drawer).toContain('import { Drawer } from "@/components/ui/drawer"');
  expect(drawer).toContain('side="left"');
  expect(shared).toContain("<dialog ref={ref}");
  expect(shared).toContain("onCancel={event =>");
  expect(shared).toContain("opener.current.focus()");
 });
 it("uses shared measured 9px radius and primary focus ring across all 22 HR routes",()=>{
  expect(routes).toHaveLength(22);
  for(const route of routes){
   const text=read(route);
   for(const className of controls)
    expect(text,route+" contains "+className).not.toContain(className);
   expect(text,route).not.toMatch(/focus-visible:outline-primary(?:-text)?(?=[\s"'])/);
   expect(text,route).not.toMatch(/(?:bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/);
  }
 });
 it("keeps HR cards and controls on semantic legacy radii, not Tailwind defaults",()=>{
  const unmeasured=/\brounded-(?:md|lg|xl|2xl)\b/;
  for(const route of routes){
   expect(read(route),route).not.toMatch(unmeasured);
  }
  const hrWidgets=readdirSync("src/components/hr").filter(name=>name.endsWith(".tsx"));
  for(const name of hrWidgets){
   expect(read(join("src/components/hr",name)),name).not.toMatch(unmeasured);
  }
  for(const name of [
   "applicant-notes-panel.tsx",
   "recruiter-placement-portfolio.tsx",
   "recruiter-result-controls.tsx",
  ]){
   expect(read(join("src/components/placements",name)),name).not.toMatch(unmeasured);
  }
 });
 it("prevents reintroducing numeric-radius and stale focus classes in HR client widgets",()=>{
  const dir="src/components/hr";
  const files=readdirSync(dir).filter(name=>name.endsWith(".tsx"));
  expect(files.length).toBeGreaterThan(15);
  for(const file of files){
   const text=read(join(dir,file));
   for(const className of controls)
    expect(text,file+" contains "+className).not.toContain(className);
   expect(text,file).not.toMatch(/focus-visible:outline-primary(?:-text)?(?=[\s"'])/);
  }
 });
});
