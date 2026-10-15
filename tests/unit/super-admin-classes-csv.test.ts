import {describe,expect,it} from "vitest";
import {parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed,superAdminScopedCsvHref}
 from "@/modules/admin-ui/super-admin-scoped-csv-model";
const statuses=["ALL","ACTIVE","ARCHIVED"] as const;
describe("Super Admin Classes CSV export",()=>{
 it("rejects invalid lifecycle, caller-supplied scope, and duplicate keys",()=>{
  expect(scopedCsvStatusAllowed("ACTIVE",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("JOINED",statuses)).toBe(false);
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("status=ACTIVE&status=ARCHIVED"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("collegeId=other"))).toThrow();
 });
 it("preserves directory filters without pagination override",()=>{
  const query=parseSuperAdminScopedCsvParams(new URLSearchParams("status=ACTIVE&q=A%20%26%20B"));
  expect(superAdminScopedCsvHref("/api/admin/classes/export",query))
   .toBe("/api/admin/classes/export?q=A+%26+B&status=ACTIVE");
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("page=5"))).toThrow();
 });
});
