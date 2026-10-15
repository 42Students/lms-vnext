import {describe,expect,it} from "vitest";
import {adminFeatureHierarchyHref} from "@/modules/module-access/admin-read-model";
describe("Super Admin feature-college hierarchy drill-in",()=>{
 it("retains a selected persisted-rule module for college hierarchy",()=>{
  expect(adminFeatureHierarchyHref("college-1","projects")).toBe("/admin/features/college-1?module=projects");
  expect(adminFeatureHierarchyHref("college-2")).toBe("/admin/features/college-2");
  expect(adminFeatureHierarchyHref("a/b","electives")).toContain("a%2Fb?module=electives");
 });
});
