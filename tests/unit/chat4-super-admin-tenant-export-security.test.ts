import {describe,expect,it} from "vitest";
import {
 buildTenantDirectoryCsv,tenantDirectoryExportHref,readTenantDirectoryExportParams,
 tenantDirectoryExportQuerySchema,TENANT_DIRECTORY_CSV_CAP,
 type TenantDirectoryExportRow,
} from "@/modules/colleges/admin-tenant-export-model";

const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
function college(name:string,id="11111111-1111-4111-8111-111111111111"):TenantDirectoryExportRow {
 return {
  id,name,code:"C-1",status:"ACTIVE",organizationId:org,
  organizationName:"Org",organizationStatus:"ACTIVE",city:"Guntur",
  state:"AP",country:"India",
  createdAt:new Date("2026-10-18T00:00:00.000Z"),
  updatedAt:new Date("2026-10-18T00:00:00.000Z"),
 };
}

describe("Super Admin tenant exports security and parity",()=>{
 it("SA-tenants-export-01 quotes formula, tabs and negative-prefix text instead of executing spreadsheet cells",()=>{
  const csv=buildTenantDirectoryCsv([
   college("=HYPERLINK(\"https://phishing.example\",\"click\")"),
   college("\t+SUM(1,2)"),
   college("-1"),
   college("@+escaped"),
   college('"Quoted", College'),
  ],false);
  expect(csv.charCodeAt(0)).toBe(0xFEFF);
  expect(csv).toContain('"\'=HYPERLINK(');
  expect(csv).toContain('"\'\t+SUM(1,2)"');
  expect(csv).toContain('"\'-1"');
  expect(csv).toContain('"\'@+escaped"');
  expect(csv).toContain('"""Quoted"", College"');
  expect(csv).not.toContain("EXPORT TRUNCATED");
 });
 it("SA-tenants-export-02 uses IST timestamps and exactly 1000 matching records, with explicit overflow footer",()=>{
  expect(TENANT_DIRECTORY_CSV_CAP).toBe(1000);
  const rows=Array.from({length:1001},(_,i)=>college("Name-"+i));
  const csv=buildTenantDirectoryCsv(rows,false);
  expect(csv).toContain("18/10/2026, 05:30:00 IST");
  expect(csv).toContain('"Name-999"');
  expect(csv).not.toContain('"Name-1000"');
  expect(csv).toContain('"EXPORT TRUNCATED"');
  expect(csv).toContain("first 1000 matching tenants");
  expect(buildTenantDirectoryCsv([college("Only")],true)).toContain("EXPORT TRUNCATED");
  expect(buildTenantDirectoryCsv([college("Only")],false)).not.toContain("EXPORT TRUNCATED");
 });
 it("SA-tenants-export-03 rejects duplicate and unknown URL filter keys, injection and malformed organization scope",()=>{
  expect(tenantDirectoryExportHref({q:"A&B",status:"ARCHIVED",organizationId:org}))
   .toContain("q=A%26B");
  expect(tenantDirectoryExportHref({q:"",status:"ACTIVE"}))
   .toBe("/api/admin/tenants/export");
  expect(readTenantDirectoryExportParams(new URLSearchParams("status=ALL"))).toMatchObject({
   status:"ALL",organizationId:"",q:"",
  });
  for(const params of [
   new URLSearchParams("status=ACTIVE&status=ARCHIVED"),
   new URLSearchParams("collegeId=foreign"),
   new URLSearchParams("organizationId=forged"),
   new URLSearchParams("page=9"),
   new URLSearchParams("status=WRONG"),
  ])expect(()=>readTenantDirectoryExportParams(params)).toThrow();
  expect(tenantDirectoryExportQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
 });
});
