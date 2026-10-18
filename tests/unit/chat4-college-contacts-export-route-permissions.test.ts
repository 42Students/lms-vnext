import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/modules/permissions/policy";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  exportCsv: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: mocks.context,
}));
vi.mock("@/modules/people/college-contacts-export-service", () => ({
  exportCollegeContactsCsv: mocks.exportCsv,
}));

import { GET } from "@/app/api/college/contacts/export/route";

beforeEach(() => {
  mocks.context.mockReset();
  mocks.exportCsv.mockReset();
  mocks.context.mockResolvedValue({ user: { id: "admin" } });
  mocks.exportCsv.mockResolvedValue({
    csv: "Name,Email\\r\\nMasked,s•••@example.edu\\r\\n",
    total: 1, exported: 1, truncated: false,
  });
});

describe("College contact CSV read route role and failure matrix", () => {
  it("COL-CONTACTS-ROUTE-01 returns friendly private errors for incompatible filters without reading sensitive data", async () => {
    const request = new Request("https://lms.example/api/college/contacts/export?tab=STUDENT&audience=FACULTY_ONLY");
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    const body = await response.json();
    expect(body.message).toBe("Contact export filters are invalid. Clear the filters and try again.");
    expect(mocks.context).not.toHaveBeenCalled();
    expect(mocks.exportCsv).not.toHaveBeenCalled();
  });

  it("COL-CONTACTS-ROUTE-02 rejects duplicate or foreign filters before loading a tenant roster", async () => {
    for (const query of [
      "tab=ALL&tab=STUDENT",
      "collegeId=11111111-1111-4111-8111-111111111111",
      "pageSize=1000",
    ]) {
      const response = await GET(new Request("https://lms.example/api/college/contacts/export?" + query));
      expect(response.status).toBe(400);
    }
    expect(mocks.context).not.toHaveBeenCalled();
    expect(mocks.exportCsv).not.toHaveBeenCalled();
  });

  it("COL-CONTACTS-ROUTE-03 emits only private, non-cacheable scoped CSV on an authorized read", async () => {
    const response = await GET(new Request("https://lms.example/api/college/contacts/export?tab=STUDENT"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("x-export-total")).toBe("1");
    expect(response.headers.get("x-export-truncated")).toBe("false");
    expect(await response.text()).toContain("s•••@example.edu");
    expect(mocks.context).toHaveBeenCalledTimes(1);
    expect(mocks.exportCsv).toHaveBeenCalledTimes(1);
    expect(mocks.exportCsv.mock.calls[0][1]).toMatchObject({tab:"STUDENT"});
  });

  it("COL-CONTACTS-ROUTE-04 denies revoked/foreign tenant permissions without returning any CSV", async () => {
    mocks.exportCsv.mockRejectedValue(new AuthorizationError("people.manage"));
    const response = await GET(new Request("https://lms.example/api/college/contacts/export"));
    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(mocks.exportCsv).toHaveBeenCalledTimes(1);
    expect(await response.text()).not.toContain("Masked");
  });
});
