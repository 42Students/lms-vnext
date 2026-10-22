import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("UX-activity-index-01 Activity Log",()=>{
 it("UX-activity-index-01 keeps exact heading, permissions and scoped export",()=>{
  const page=read("src/app/(authenticated)/activity/page.tsx");
  expect(page).toContain('title="Activity Log"');
  expect(page).toContain('redirect("/dashboard")');
  expect(page).toContain("isSuperAdmin(context)");
  expect(page).toContain("/api/activity/college-export");
  expect(page).toContain("/api/activity/admin-export");
 });
 it("UX-activity-index-02 uses shared, accessible mobile-safe filter controls",()=>{
  const page=read("src/app/(authenticated)/activity/page.tsx");
  expect(page).toContain('import { Input }');
  expect(page).toContain('import { Select }');
  expect(page).toContain('<Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>');
  expect(page).toContain('grid-cols-1');
  expect(page).toContain('md:grid-cols-2');
  const list=read("src/components/activity/activity-center.tsx");
  expect(list).toContain('<Card as="article"');
  expect(list).toContain('<EmptyState');
  expect(list).toContain('No meaningful activity matches these filters.');
  expect(list).toContain('Technical request noise is intentionally excluded from this center.');
  expect(list).toContain('min-h-11');
 });
 it("UX-activity-loading-03 keeps legacy heading and bounded recovery",()=>{
  const loading=read("src/app/(authenticated)/activity/loading.tsx");
  expect(loading).toContain("Activity Log");
  expect(loading).toContain("<GracefulPageLoading");
  expect(read("src/components/ui/graceful-page-loading.tsx")).toContain("12_000");
 });
});