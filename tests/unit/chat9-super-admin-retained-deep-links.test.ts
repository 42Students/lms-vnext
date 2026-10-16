import {describe,expect,it} from "vitest";
import {legacySidebarItemActive} from "@/components/shell/legacy-sidebar-active-model";
import {superAdminItems} from "@/components/shell/shell-model";
import {superAdminLegacyGroupForPath,superAdminLegacyTabActive} from
 "@/modules/people/super-admin-legacy-tabs-model";
describe("Super Admin retained recruiter and audit deep links",()=>{
 it("keeps /admin/hr implementation inside the legacy recruiter tab",()=>{
  expect(superAdminLegacyGroupForPath("/admin/hr")?.title).toBe("Placements");
  expect(superAdminLegacyTabActive("/admin/hr","/admin/recruiters")).toBe(true);
  expect(superAdminLegacyTabActive("/admin/hr","/admin/placements")).toBe(false);
 });
 it("retains the Activity Log sidebar row when opening Audit Findings",()=>{
  const row=superAdminItems.find(r=>r.label==="Activity Log")!;
  expect(legacySidebarItemActive("/tracker/audit-findings",row,null,null)).toBe(true);
  expect(legacySidebarItemActive("/tracker/audit-findings/abc",row,null,null)).toBe(true);
 });
});
