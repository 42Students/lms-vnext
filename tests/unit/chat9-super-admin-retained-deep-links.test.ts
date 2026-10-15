import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {superAdminLegacyGroupForPath,superAdminLegacyTabActive} from
 "@/modules/people/super-admin-legacy-tabs-model";
describe("Super Admin retained recruiter and audit deep links",()=>{
 it("keeps /admin/hr implementation inside the legacy recruiter tab",()=>{
  expect(superAdminLegacyGroupForPath("/admin/hr")?.title).toBe("Placements");
  expect(superAdminLegacyTabActive("/admin/hr","/admin/recruiters")).toBe(true);
  expect(superAdminLegacyTabActive("/admin/hr","/admin/placements")).toBe(false);
 });
 it("retains the Activity Log sidebar row when opening Audit Findings",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/shell/sidebar-nav.tsx"),"utf8");
  expect(source).toContain('item.label==="Activity Log"');
  expect(source).toContain('pathname.startsWith("/tracker/audit-findings/")');
 });
});
