import {describe,expect,it} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {COLLEGE_LEGACY_GROUPS} from "@/modules/people/college-legacy-tabs-model";
import {SUPER_ADMIN_LEGACY_GROUPS} from "@/modules/people/super-admin-legacy-tabs-model";
describe("Super Admin Courses & Content exact legacy tabs",()=>{
 it("exposes Courses, Lessons, Video, Resources, Live Classes, Assignments, Quizzes, Progress",()=>{
  const actual=SUPER_ADMIN_LEGACY_GROUPS.find(g=>g.title==="Courses & Content")!.tabs;
  expect(actual.map(x=>x.label)).toEqual(COLLEGE_LEGACY_GROUPS[1]!.tabs.map(x=>x.label));
  for(const tab of actual)
   expect(existsSync(join(process.cwd(),"src/app/(authenticated)",tab.href.slice(1),"page.tsx")),tab.href).toBe(true);
 });
});
