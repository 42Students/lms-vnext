import {describe,expect,it} from "vitest";
import {parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed,superAdminScopedCsvHref}
 from "@/modules/admin-ui/super-admin-scoped-csv-model";
const statuses=["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"] as const;
describe("Super Admin Batches CSV export",()=>{
 it("permits appropriate lifecycle statuses, rejects contradictions and duplicates",()=>{
  expect(scopedCsvStatusAllowed("PLANNED",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("WITHDRAWN",statuses)).toBe(false);
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("q=a&q=b"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("organizationId=other"))).toThrow();
 });
 it("preserves search/status but never page or explicit college",()=>{
  const query=parseSuperAdminScopedCsvParams(new URLSearchParams("status=PLANNED&q=A%20%26%20B"));
  expect(superAdminScopedCsvHref("/api/admin/batches/export",query))
   .toBe("/api/admin/batches/export?q=A+%26+B&status=PLANNED");
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("page=3"))).toThrow();
 });
});
