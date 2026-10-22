import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("legacy Super Admin and College Admin Activity Log export button",()=>{
 it("uses exact Export button copy while retaining both scoped export endpoints",()=>{
  const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/activity/page.tsx"),"utf8").split("\r").join("");
  expect(s).toContain('"/api/activity/admin-export"');
  expect(s).toContain('"/api/activity/college-export"');
  expect(s).toContain("Export current page (8 columns)");
  expect(s).toContain("Export all matching CSV");
  expect(s).toContain("importantOnly ?");
  expect(s).toContain("All-matching Important-only export requires the category-aware export API.");
  expect(s).not.toContain("Export filtered CSV (max 1,000)");
 });
});
