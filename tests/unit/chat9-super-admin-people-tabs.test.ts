import {describe,expect,it} from "vitest";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {SUPER_ADMIN_LEGACY_GROUPS} from "@/modules/people/super-admin-legacy-tabs-model";
describe("Super Admin People legacy tab strip",()=>{
 it("keeps Faculty, Faculty Assignment, Students, People Directory in order",()=>{
  const tabs=SUPER_ADMIN_LEGACY_GROUPS.find(x=>x.title==="People")!.tabs;
  expect(tabs).toEqual([
   {label:"Faculty",href:"/admin/faculty"},
   {label:"Faculty Assignment",href:"/admin/faculty-assignment"},
   {label:"Students",href:"/admin/students"},
   {label:"People Directory",href:"/admin/people"},
  ]);
  for(const tab of tabs)
   expect(existsSync(join(process.cwd(),"src/app/(authenticated)",tab.href.slice(1),"page.tsx")),tab.href).toBe(true);
 });
});
