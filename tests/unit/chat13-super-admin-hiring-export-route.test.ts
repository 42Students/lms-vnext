import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({
  getCurrentRequestContext:vi.fn(),
  getSuperAdminCompanyHiringReport:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:mocks.getCurrentRequestContext,
}));
vi.mock("@/modules/admin-ui/super-admin-hiring-report-service",()=>({
  getSuperAdminCompanyHiringReport:mocks.getSuperAdminCompanyHiringReport,
}));
import {GET} from "@/app/api/admin/placements/hiring-report/export/route";

describe("SA-HIRING-EXPORT-13 protected Super Admin CSV route",()=>{
  beforeEach(()=>{
    for(const fn of Object.values(mocks))fn.mockReset();
    mocks.getCurrentRequestContext.mockResolvedValue({
      user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
      membership:null,adminScope:{organizationId:"org-a",collegeId:"college-a"},
    });
    mocks.getSuperAdminCompanyHiringReport.mockResolvedValue({rows:[],truncated:false});
  });
  const get=(qs:string)=>GET(new Request("https://example.test/api/admin/placements/hiring-report/export"+qs));

  it("denies ambiguous duplicate job, date and academic IDs before reading private records",async()=>{
    for(const path of [
      "?jobId=11111111-1111-4111-8111-111111111111&jobId=22222222-2222-4222-8222-222222222222",
      "?appliedFrom=2026-10-01&appliedFrom=2026-10-02",
      "?departmentId=11111111-1111-4111-8111-111111111111&departmentId=22222222-2222-4222-8222-222222222222",
      "?q=a&q=b",
    ]){
      const response=await get(path);
      expect(response.status,path).toBe(400);
      expect(await response.json()).toMatchObject({error:"INVALID_REPORT_FILTERS"});
    }
    expect(mocks.getCurrentRequestContext).not.toHaveBeenCalled();
    expect(mocks.getSuperAdminCompanyHiringReport).not.toHaveBeenCalled();
  });

  it("rejects invalid dates and unknown query keys without performing a report read",async()=>{
    for(const qs of ["?appliedFrom=2026-02-30","?companyId=other-tenant","?q="+encodeURIComponent("x".repeat(101))]){
      const response=await get(qs);
      expect(response.status).toBe(400);
    }
    expect(mocks.getSuperAdminCompanyHiringReport).not.toHaveBeenCalled();
  });

  it("serves a valid bounded export with private no-cache headers and zero modifications",async()=>{
    const response=await get("?appliedFrom=2026-10-01&appliedTo=2026-10-31&q=graduate");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Export-Truncated")).toBe("false");
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toContain("hiring-report-");
    expect(await response.text()).toContain("Total Applications");
    expect(mocks.getSuperAdminCompanyHiringReport).toHaveBeenCalledTimes(1);
    expect(mocks.getSuperAdminCompanyHiringReport.mock.calls[0]?.[1]).toMatchObject({
      appliedFrom:"2026-10-01",appliedTo:"2026-10-31",q:"graduate",
    });
  });
});
