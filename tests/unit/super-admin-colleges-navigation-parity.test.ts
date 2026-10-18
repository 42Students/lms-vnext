import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/admin/colleges/page.tsx","utf8");
describe("College setup links across responsive views",()=>{
 it("renders scoped tenant setup links in desktop and mobile",()=>{
  expect((src.match(/Tenant setup/g)||[]).length).toBeGreaterThanOrEqual(1);
  expect(src).toContain('mobilePriority: "action"');
  expect(src).toContain("<DataTable columns={columns} rows={visible}");
  expect(src).toContain("encodeURIComponent(college.id)");
 });
 it("has both branding and readiness in mobile cards",()=>{
  const shared=src.split('mobilePriority: "action"')[1]||"";
  expect(shared).toContain("Branding");
  expect(shared).toContain("Readiness");
  expect(shared).toContain("Tenant setup");
  const table=readFileSync("src/components/ui/data-table.tsx","utf8");
  expect(table).toContain('mobilePriority==="action"');
  expect(table).toContain('<ScrollCue axis="x"');
 });
});
