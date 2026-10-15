import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("Super Admin legacy verification exact page copy",()=>{
 const src=readFileSync(join(process.cwd(),
  "src/app/(authenticated)/admin/verification/page.tsx"),"utf8");
 it("retains exact legacy title, subtitle, and selected-college direction",()=>{
  expect(src).toContain('title="Profile verification"');
  expect(src).toContain("Students' education and identity, checked against their documents.");
  expect(src).toContain("Choose a college at the top to see its students waiting for verification.");
 });
 it("never selects the first college or exposes cross-college decisions",()=>{
  expect(src).toContain('if (collegeId) {');
  expect(src).toContain('redirect(`/admin/colleges/${encodeURIComponent(collegeId)}/verification`);');
  expect(src).toContain("requirePermission(context, \"admin-scope.select\")");
  expect(src).toContain('href="/admin/colleges"');
 });
});
