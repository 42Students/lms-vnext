import {describe,expect,it} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {COLLEGE_LEGACY_GROUPS} from "@/modules/people/college-legacy-tabs-model";
import {SUPER_ADMIN_LEGACY_GROUPS,superAdminLegacyGroupForPath} from "@/modules/people/super-admin-legacy-tabs-model";
describe("Super Admin Academic Setup strip",()=>{
 it("reuses all ten exact College legacy names in order",()=>{
  const expected=COLLEGE_LEGACY_GROUPS[0]!.tabs;
  const actual=SUPER_ADMIN_LEGACY_GROUPS.find(g=>g.title==="Academic Setup")!.tabs;
  expect(actual.map(x=>x.label)).toEqual(expected.map(x=>x.label));
  expect(actual.map(x=>x.href)).toEqual(expected.map(x=>x.href.replace("/college/","/admin/")));
  for(const tab of actual)
   expect(existsSync(join(process.cwd(),"src/app/(authenticated)",tab.href.slice(1),"page.tsx")),tab.href).toBe(true);
 });
 it("maps descendants to Academic Setup, not another role",()=>{
  expect(superAdminLegacyGroupForPath("/admin/departments")?.title).toBe("Academic Setup");
  expect(superAdminLegacyGroupForPath("/admin/attendance")?.title).toBe("Academic Setup");
 });
});
