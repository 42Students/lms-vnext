import {describe,expect,it} from "vitest";
import {
  buildTenantDirectoryCsv,
  readTenantDirectoryExportParams,
  tenantDirectoryCsvCell,
  TENANT_DIRECTORY_CSV_CAP,
  type TenantDirectoryExportRow,
} from "@/modules/colleges/admin-tenant-export-model";

const row=(i:number, name:string):TenantDirectoryExportRow=>({
  id:String(i),name,code:"C-"+i,status:"ACTIVE",
  organizationId:"org",organizationName:"IIT Dharwad",
  organizationStatus:"ACTIVE",city:null,state:"Karnataka",
  country:"India",createdAt:new Date("2026-10-18T10:00:00.000Z"),
  updatedAt:new Date("2026-10-18T11:00:00.000Z"),
});
describe("Super Admin tenant directory CSV: formula injection, cap and query security",()=>{
  it("SA-tenants-exports-12 guards arbitrary invisible Unicode before spreadsheet formulas",()=>{
    for(const prefix of [""," ","\t","\u200B","\u2066","\u2069","\uFEFF","\u0301","\u034F"," \u202E"]){
      for(const first of ["=","+","-","@"]){
        const payload=prefix+first+"HYPERLINK(1)";
        expect(tenantDirectoryCsvCell(payload),JSON.stringify(payload))
          .toBe('"\''+payload+'"');
      }
    }
    expect(tenantDirectoryCsvCell('Valid, "College"'))
      .toBe('"Valid, ""College"""');
    expect(tenantDirectoryCsvCell("Normal campus")).toBe('"Normal campus"');
  });
  it("SA-tenants-exports-13 safe exported rows preserve UTF-8 BOM, quoting, IST and row cap",()=>{
    const name="\u200B=HYPERLINK(1)";
    const csv=buildTenantDirectoryCsv([row(1,name)],false);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("'"+name);
    expect(csv).toContain("18/10/2026");
    expect(csv).toContain(" IST");
    expect(csv).not.toContain("EXPORT TRUNCATED");
    const oversized=buildTenantDirectoryCsv(
      Array.from({length:TENANT_DIRECTORY_CSV_CAP+1},(_,i)=>row(i,"College "+i)),false);
    expect(oversized).toContain("EXPORT TRUNCATED");
    expect(oversized).toContain("Only the first "+TENANT_DIRECTORY_CSV_CAP);
    expect(oversized).not.toContain("College "+TENANT_DIRECTORY_CSV_CAP+'"');
  });
  it("SA-tenants-exports-14 duplicate, invalid or unknown export filters are rejected",()=>{
    for(const query of [
      "?page=2","?status=INVALID","?q="+"x".repeat(101),
      "?status=ACTIVE&status=ARCHIVED","?unknown=unsafe",
    ]){
      expect(()=>readTenantDirectoryExportParams(new URLSearchParams(query)))
        .toThrow();
    }
    expect(readTenantDirectoryExportParams(
      new URLSearchParams("?q=IIT+Dharwad&status=ALL"),
    )).toMatchObject({q:"IIT Dharwad",status:"ALL"});
  });
});
