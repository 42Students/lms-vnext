import {describe,expect,it} from "vitest";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";

const read=(path:string)=>readFileSync(path,"utf8");
const inventory=read("docs/orchestrator/ui-ux/pages-hr.md");
const routes=[...inventory.matchAll(/\((src\/app\/\(authenticated\)\/hr\/[^\n)]+)\)/g)]
 .map(match=>match[1]);
const antiDrift=[
 "text-[var(--lms-teal-deep)]","text-[var(--lms-link-text)]",
 "outline-[var(--lms-teal-deep)]","rounded-[var(--radius)]",
];
describe("NORTH-STAR-HR-01: legacy shell color, focus, radius and shadow sweep",()=>{
 it("audits all 22 HR portal routes from the checked-in owner inventory",()=>{
  expect(routes).toHaveLength(22);
  expect(new Set(routes).size).toBe(22);
  for(const route of routes){
   const source=read(route);
   for(const token of antiDrift)expect(source,route+" uses "+token).not.toContain(token);
   expect(source,route).not.toMatch(/(?:bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/);
  }
 });
 it("aligns HR widget focus and notification overlays to legacy tokens",()=>{
  const dir="src/components/hr";
  const components=readdirSync(dir).filter(name=>name.endsWith(".tsx"));
  expect(components.length).toBeGreaterThan(15);
  for(const file of components){
   const source=read(join(dir,file));
   for(const token of antiDrift)expect(source,file+" uses "+token).not.toContain(token);
   expect(source,file).not.toMatch(/\bshadow-(?:lg|xl)\b/);
  }
 });
 it("preserves the existing HR sections and shared PageHeader instead of replacing the content",()=>{
  for(const route of [
   "src/app/(authenticated)/hr/home/page.tsx",
   "src/app/(authenticated)/hr/drives/page.tsx",
   "src/app/(authenticated)/hr/company/page.tsx",
   "src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx",
  ]){
   const page=read(route);
   expect(page).toContain("PageHeader");
   expect(page).toContain("text-link");
   expect(page).toContain("outline-[var(--lms-primary)]");
  }
 });
});
