import {describe,expect,it} from "vitest";
import {buildSuperAdminScopedCsv,parseSuperAdminScopedCsvParams,superAdminScopedCsvHref,scopedCsvStatusAllowed}
 from "@/modules/admin-ui/super-admin-scoped-csv-model";
describe("Super Admin faculty CSV security",()=>{
 it("rejects caller-supplied scope, page overrides and duplicated filters",()=>{
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("collegeId=foreign"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("page=2"))).toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("status=ACTIVE&status=ENDED"))).toThrow();
  expect(scopedCsvStatusAllowed("SCHEDULED",["ALL","ACTIVE","SUSPENDED","ENDED"])).toBe(false);
 });
 it("escapes spreadsheet formulae and quotes and preserves filters",()=>{
  const csv=buildSuperAdminScopedCsv([{id:"id1",title:'=IMPORT("secret")',subtitle:"College",status:"ACTIVE",details:['\"x\"',"-danger"]}],false);
  expect(csv).toContain('"\'=IMPORT(""secret"")"');
  expect(csv).toContain('""x""');
  expect(csv).not.toContain("EXPORT TRUNCATED");
  expect(superAdminScopedCsvHref("/api/admin/faculty/export",{q:"A & B",status:"ACTIVE"}))
   .toBe("/api/admin/faculty/export?q=A+%26+B&status=ACTIVE");
 });
});
