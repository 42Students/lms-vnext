import {describe,expect,it} from "vitest";
import {parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed,superAdminScopedCsvHref}
 from "@/modules/admin-ui/super-admin-scoped-csv-model";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
describe("Super Admin Students CSV export",()=>{
 it("only permits this directory statuses and one status filter",()=>{
  expect(scopedCsvStatusAllowed("ACTIVE",statuses)).toBe(true);
  expect(scopedCsvStatusAllowed("PUBLISHED",statuses)).toBe(false);
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("q=a&q=b"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("organizationId=other"))).toThrow();
 });
 it("uses matching filtered query without allowing page override",()=>{
  const query=parseSuperAdminScopedCsvParams(new URLSearchParams("status=ACTIVE&q=A%20%26%20B"));
  expect(query.q).toBe("A & B");
  expect(superAdminScopedCsvHref("/api/admin/students/export",query))
   .toBe("/api/admin/students/export?q=A+%26+B&status=ACTIVE");
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("page=3"))).toThrow();
 });
});
