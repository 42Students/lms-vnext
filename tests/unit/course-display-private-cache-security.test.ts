import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentContext: vi.fn(),
  sameOrigin: vi.fn(),
  ready: vi.fn(),
  getDisplay: vi.fn(),
  updateDisplay: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: mocks.currentContext,
}));
vi.mock("@/auth/origin", () => ({
  isSameOriginRequest: mocks.sameOrigin,
}));
vi.mock("@/modules/courses/course-display-readiness", () => ({
  courseDisplayRuntimeEnabled: mocks.ready,
}));
vi.mock("@/modules/courses/course-display-service", () => ({
  getAdminCourseDisplayContent: mocks.getDisplay,
  updateCourseDisplayContent: mocks.updateDisplay,
}));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => Response.json({ error: "FORBIDDEN" }, { status: 403 }),
}));

import { GET, PUT } from "@/app/api/courses/[courseId]/display/route";

const courseId = "550e8400-e29b-41d4-a716-446655440000";
const routeContext = { params: Promise.resolve({ courseId }) };
function request(method: "GET" | "PUT", body?: string) {
  return new Request("https://tenant.example.edu/api/courses/" + courseId + "/display", {
    method,
    headers: { host: "tenant.example.edu", origin: "https://tenant.example.edu" },
    ...(body === undefined ? {} : { body }),
  });
}
function expectPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("vary")).toContain("Cookie");
}

describe("scoped course display HTTP cache isolation", () => {
  beforeEach(() => {
    for (const method of Object.values(mocks)) method.mockReset();
    mocks.ready.mockReturnValue(true);
    mocks.sameOrigin.mockReturnValue(true);
    mocks.currentContext.mockResolvedValue({ user: { id: "tenant-admin" } });
    mocks.getDisplay.mockResolvedValue({ bodyHtml: "<p>Private overview</p>" });
    mocks.updateDisplay.mockResolvedValue({ version: 2 });
  });

  it("does not cache authorized GETs which vary by the logged-in course owner", async () => {
    const response = await GET(request("GET"), routeContext);
    expect(response.status).toBe(200);
    expectPrivate(response);
    expect(mocks.getDisplay).toHaveBeenCalledTimes(1);
  });

  it("does not cache denied GETs", async () => {
    mocks.getDisplay.mockRejectedValue(new Error("FORBIDDEN"));
    const response = await GET(request("GET"), routeContext);
    expect(response.status).toBe(403);
    expectPrivate(response);
  });

  it("does not cache runtime-unavailable responses", async () => {
    mocks.ready.mockReturnValue(false);
    const response = await GET(request("GET"), routeContext);
    expect(response.status).toBe(503);
    expectPrivate(response);
    expect(mocks.getDisplay).not.toHaveBeenCalled();
  });

  it("does not cache successful mutations", async () => {
    const body = JSON.stringify({
      introductionText: null,
      bodyHtml: "<p>Private update</p>",
      takeaways: [],
      thumbnailUrl: null,
      expectedVersion: 1,
    });
    const response = await PUT(request("PUT", body), routeContext);
    expect(response.status).toBe(200);
    expectPrivate(response);
    expect(mocks.updateDisplay).toHaveBeenCalledTimes(1);
  });

  it("does not cache invalid-origin or malformed mutation responses", async () => {
    mocks.sameOrigin.mockReturnValue(false);
    const origin = await PUT(request("PUT", "{}"), routeContext);
    expect(origin.status).toBe(403);
    expectPrivate(origin);
    expect(mocks.updateDisplay).not.toHaveBeenCalled();
    mocks.sameOrigin.mockReturnValue(true);
    const malformed = await PUT(request("PUT", "bad-json"), routeContext);
    expect(malformed.status).toBe(400);
    expectPrivate(malformed);
    expect(mocks.updateDisplay).not.toHaveBeenCalled();
  });

  it("does not cache authorization failures on PUT", async () => {
    const body = JSON.stringify({
      introductionText: null,
      bodyHtml: null,
      takeaways: [],
      thumbnailUrl: null,
      expectedVersion: 1,
    });
    mocks.updateDisplay.mockRejectedValue(new Error("FORBIDDEN"));
    const response = await PUT(request("PUT", body), routeContext);
    expect(response.status).toBe(403);
    expectPrivate(response);
  });
});
