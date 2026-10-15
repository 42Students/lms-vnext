import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("legacy Super Admin and College Admin Activity Log export button",()=>{
 it("uses exact Export button copy while retaining both scoped export endpoints",()=>{
  const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/activity/page.tsx"),"utf8");
  expect(s).toContain('"/api/activity/admin-export"');
  expect(s).toContain('"/api/activity/college-export"');
  expect(s).toContain("            Export\n          </a>");
  expect(s).not.toContain("Export filtered CSV (max 1,000)");
 });
});
