import {describe,expect,it} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
import {COLLEGE_LEGACY_GROUPS,collegeLegacyGroupForPath} from "@/modules/people/college-legacy-tabs-model";
describe("attendance department report entry",()=>{
 it("is reachable from the Attendance tab without inventing a new group tab",()=>{
   const root=join(process.cwd(),"src/app/(authenticated)/college");
   const src=readFileSync(join(root,"attendance/page.tsx"),"utf8");
   expect(src).toContain('href: "/college/attendance/departments"');
   expect(src).toContain("Attendance by Department");
   expect(existsSync(join(root,"attendance/departments/page.tsx"))).toBe(true);
   expect(COLLEGE_LEGACY_GROUPS[0]?.tabs.some(t=>t.label==="Attendance by Department")).toBe(false);
   expect(collegeLegacyGroupForPath("/college/attendance/departments")?.title).toBe("Academic Setup");
 });
});
