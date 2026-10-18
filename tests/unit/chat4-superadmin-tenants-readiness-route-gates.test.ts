import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/modules/permissions/policy";
import { evaluateCollegeReadiness } from "@/modules/colleges/readiness-model";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  tenantExport: vi.fn(),
  readiness: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: mocks.context,
}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service", () => ({
  exportSuperAdminTenantDirectory: mocks.tenantExport,
}));
vi.mock("@/modules/colleges/readiness-service", () => ({
  getSuperAdminCollegeReadiness: mocks.readiness,
}));

import { GET as exportTenants } from "@/app/api/admin/tenants/export/route";
import { GET as exportReadiness } from "@/app/api/admin/colleges/[collegeId]/readiness/export/route";

const collegeId = "11111111-1111-4111-8111-111111111111";
const request = (url: string) => new Request("https://lms.example" + url);
const readinessRequest = (id = collegeId) =>
  exportReadiness(request("/api/admin/colleges/" + id + "/readiness/export"), {
    params: Promise.resolve({ collegeId: id }),
  });

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.context.mockResolvedValue({
    user: {id:"superadmin",systemRoles:["SUPER_ADMIN"],platformStatus:"ACTIVE"},
    membership:null,adminScope:null,
  });
  mocks.tenantExport.mockResolvedValue({
    csv: "ID,Name\\r\\n1,IIT Dharwad\\r\\n", cap: 1000, truncated:false,
  });
  mocks.readiness.mockResolvedValue({
    college:{ id:collegeId,name:"IIT Dharwad",code:"iit-dharwad" },
    evaluation:evaluateCollegeReadiness({
      collegeStatus:"ACTIVE",adminMemberships:1,departments:1,programs:1,cohorts:1,
      enrolledLearners:1,facultyMemberships:1,tpoMemberships:1,
      activePlacementSeasons:1,verifiedPrimaryDomains:1,
    }),
    supplemental:{activeLectureHalls:1,attendancePolicyRecord:true},
  });
});

describe("Super Admin tenant and readiness CSV routes", () => {
  it("SA-COL-TENANT-ROUTE-01 returns only scope-authorized private CSV with export cap metadata", async () => {
    const response=await exportTenants(request("/api/admin/tenants/export?q=IIT&status=ACTIVE"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-export-row-cap")).toBe("1000");
    expect(mocks.tenantExport).toHaveBeenCalledTimes(1);
    expect(mocks.tenantExport.mock.calls[0][1]).toMatchObject({q:"IIT",status:"ACTIVE"});
    expect(await response.text()).toContain("IIT Dharwad");
  });

  it("SA-COL-TENANT-ROUTE-02 rejects forged or repeated filters without querying tenant data", async () => {
    for (const query of ["page=3","organizationId=not-a-uuid","status=ACTIVE&status=ALL","secret=1"]) {
      const response=await exportTenants(request("/api/admin/tenants/export?"+query));
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
    expect(mocks.tenantExport).not.toHaveBeenCalled();
  });

  it("SA-COL-TENANT-ROUTE-03 fails closed on revoked Super Admin authority", async () => {
    mocks.tenantExport.mockRejectedValue(new AuthorizationError("college.read"));
    const response=await exportTenants(request("/api/admin/tenants/export"));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.tenantExport).toHaveBeenCalledTimes(1);
    expect(await response.text()).not.toContain("IIT Dharwad");
  });

  it("SA-COL-READINESS-ROUTE-01 returns CSV without caching or browser MIME guessing", async () => {
    const response=await readinessRequest();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(await response.text()).toContain("IIT Dharwad");
    expect(mocks.readiness).toHaveBeenCalledTimes(1);
    expect(mocks.readiness.mock.calls[0][1]).toBe(collegeId);
  });

  it("SA-COL-READINESS-ROUTE-02 does not expose a foreign/missing college and retains friendly no-store errors", async () => {
    mocks.readiness.mockResolvedValue(null);
    const missing=await readinessRequest();
    expect(missing.status).toBe(404);
    expect(missing.headers.get("cache-control")).toBe("private, no-store");
    expect((await missing.json()).message).toBe("College readiness evidence was not found.");
    mocks.readiness.mockClear();
    const malformed=await readinessRequest("not-a-uuid");
    expect(malformed.status).toBe(400);
    expect(malformed.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.readiness).not.toHaveBeenCalled();
    mocks.readiness.mockRejectedValue(new AuthorizationError("college.read"));
    const denied=await readinessRequest();
    expect(denied.status).toBe(403);
    expect(denied.headers.get("cache-control")).toBe("private, no-store");
  });
});
