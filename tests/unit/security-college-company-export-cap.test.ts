import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  context: vi.fn(), recent: vi.fn(), list: vi.fn(), apiError: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: mock.context }));
vi.mock("@/auth/recent-device-auth", () => ({
  requireRecentDeviceAuthentication: mock.recent,
}));
vi.mock("@/modules/placements/college-company-directory-service", () => ({
  listCollegeCompanyDirectory: mock.list,
}));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: mock.apiError }));

import { GET, COLLEGE_COMPANY_EXPORT_CAP } from "@/app/api/college/companies/export/route";

const actor = {
  user: { id: "college-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "member-a", collegeId: "college-a", organizationId: "org-a",
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};

const companies = Array.from({ length: 6_001 }, (_, i) => ({
  companyId: "company-" + String(i).padStart(5, "0"),
  name: "Company " + i, industry: null, websiteUrl: null, drives: 0,
  companyStatus: "ACTIVE", relationshipStatus: "ACTIVE",
}));
const request = (query = "") =>
  new Request("https://tenant.example.test/api/college/companies/export" + query);

describe("SEC-08 / SEC-13 — bounded private college company export", () => {
  beforeEach(() => {
    for (const fn of Object.values(mock)) fn.mockReset();
    mock.context.mockResolvedValue(actor);
    mock.recent.mockResolvedValue({ userId: "college-admin" });
    mock.list.mockImplementation(async (_context, _query, options) => {
      const start = options.exportOffset ?? 0;
      return { items: companies.slice(start, start + 2_000), total: companies.length };
    });
    mock.apiError.mockImplementation(() => new Response(
      JSON.stringify({ error: "RECENT_SIGN_IN_REQUIRED" }),
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    ));
  });

  it("stops at exactly 5000 rows instead of loading all matching companies", async () => {
    const response = await GET(request("?q=Company"));
    expect(COLLEGE_COMPANY_EXPORT_CAP).toBe(5000);
    expect(response.status).toBe(200);
    expect(mock.recent).toHaveBeenCalledTimes(1);
    expect(mock.list).toHaveBeenCalledTimes(3);
    expect(mock.list.mock.calls.map(call => call[2]?.exportOffset ?? 0))
      .toEqual([0, 2000, 4000]);
    for (const [context] of mock.list.mock.calls) expect(context).toBe(actor);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Export-Row-Cap")).toBe("5000");
    expect(response.headers.get("X-Export-Included")).toBe("5000");
    expect(response.headers.get("X-Export-Total")).toBe("6001");
    expect(response.headers.get("X-Export-Truncated")).toBe("true");
    const body = await response.text();
    expect(body).toContain("company-04999");
    expect(body).not.toContain("company-05000");
    expect(body).not.toContain("company-06000");
    expect((body.match(/company-\d{5}/g) ?? [])).toHaveLength(5000);
  });

  it("preserves a short, complete export without a false truncated flag", async () => {
    mock.list.mockImplementation(async () => ({
      items: companies.slice(0, 3), total: 3,
    }));
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Export-Included")).toBe("3");
    expect(response.headers.get("X-Export-Truncated")).toBe("false");
    expect(mock.list).toHaveBeenCalledOnce();
  });

  it("stale sign-in denies the export before touching the company repository", async () => {
    mock.recent.mockRejectedValue(new Error("RECENT_SIGN_IN_REQUIRED"));
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mock.list).not.toHaveBeenCalled();
    expect(mock.apiError).toHaveBeenCalledOnce();
    expect(await response.text()).not.toContain("Company 0");
  });
});
