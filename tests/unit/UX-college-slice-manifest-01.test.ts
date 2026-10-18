import {describe,it,expect} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
const root=process.cwd();
const manifest=readFileSync(join(root,"docs/orchestrator/ui-ux/pages-college.md"),"utf8");
// The manifest's route code paths include parentheses in (authenticated); parse line-by-line instead.
const entries=manifest.split(/\r?\n/).filter(line=>line.startsWith("- [")&&line.includes("`/college"));
const scoped=entries.slice(42);
function routeOf(line:string){const match=line.match(/\`(\/college[^\`]+)\`/);if(!match)throw Error("Invalid College UX route");return match[1];}
function slugOf(route:string){return route.replace(/^\//,"").replaceAll("/","-").replaceAll("[","").replaceAll("]","");}
function sourceOf(route:string){return join(root,"src/app/(authenticated)"+route,"page.tsx");}
function readSource(route:string){return readFileSync(sourceOf(route),"utf8");}
describe("College UX second-half source completeness",()=>{
 it("UX-college-slice-01 enumerates exactly 43 routes in their signed-off order",()=>{
  expect(entries).toHaveLength(85);
  expect(scoped).toHaveLength(43);
  expect(routeOf(scoped[0])).toBe("/college/people");
  expect(routeOf(scoped[42])).toBe("/college/videos");
 });
 it("UX-college-slice-02 all routes have source, per-page UX evidence and named tests",()=>{
  for(const line of scoped){
   const route=routeOf(line),slug=slugOf(route);
   expect(existsSync(sourceOf(route)),route+" source").toBe(true);
   expect(existsSync(join(root,"docs/audit/ux",slug+".md")),route+" UX note").toBe(true);
   const testPath=join(root,"tests/unit","UX-"+slug+"-01.test.ts");
   expect(existsSync(testPath),route+" test").toBe(true);
   expect(readFileSync(testPath,"utf8")).toContain("UX-college-");
  }
 });
 it("UX-college-slice-03 responsive DataTable callers supply explicit empty copy",()=>{
  const tableRoutes=[
   "/college/people/manage",
   "/college/placements/drives",
   "/college/placements/interviews",
   "/college/placements/jobs/[jobId]/applications",
   "/college/placements/jobs/[jobId]/interviews",
   "/college/placements/jobs/[jobId]/shortlisted",
   "/college/placements/retention",
   "/college/placements/student-lookup",
   "/college/projects/templates",
  ];
  for(const route of tableRoutes) {
   const source=readSource(route);
   expect(source,route+" DataTable").toContain("<DataTable");
   expect(source,route+" explicit empty copy").toContain("empty=");
  }
 });
});
