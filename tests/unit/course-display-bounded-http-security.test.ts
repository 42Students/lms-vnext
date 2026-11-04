import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  origin: vi.fn(),
  ready: vi.fn(),
  getDisplay: vi.fn(),
  updateDisplay: vi.fn(),
}));

vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: mocks.context,
}));
vi.mock("@/auth/origin", () => ({
  isSameOriginRequest: mocks.origin,
}));
vi.mock("@/modules/courses/course-display-readiness", () => ({
  courseDisplayRuntimeEnabled: mocks.ready,
}));
vi.mock("@/modules/courses/course-display-service", () => ({
  getAdminCourseDisplayContent: mocks.getDisplay,
  updateCourseDisplayContent: mocks.updateDisplay,
}));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => new Response(null, { status: 500 }),
}));

import { PUT } from "@/app/api/courses/[courseId]/display/route";

const courseId = "550e8400-e29b-41d4-a716-446655440000";
const routeContext = { params: Promise.resolve({ courseId }) };

function put(body: string, headers: Record<string, string> = {}) {
  return new Request("https://lms.example.edu/api/courses/" + courseId + "/display", {
    method: "PUT",
    headers: {
      host: "lms.example.edu",
      origin: "https://lms.example.edu",
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
}

describe("course display mutation bounded HTTP body", () => {
  beforeEach(() => {
    for (const fn of Object.values(mocks)) fn.mockReset();
    mocks.context.mockResolvedValue({ user: { id: "authenticated" } });
    mocks.origin.mockReturnValue(true);
    mocks.ready.mockReturnValue(true);
    mocks.updateDisplay.mockResolvedValue({ version: 1 });
  });

  it("accepts a legitimate, sanitized course description via bounded parsing", async () => {
    const input = {
      introductionText: "Welcome",
      bodyHtml: "<p>Hello <strong>learners</strong></p>",
      takeaways: ["Practical skills"],
      thumbnailUrl: "https://cdn.example.edu/course.png",
      expectedVersion: null,
    };
    const response = await PUT(put(JSON.stringify(input)), routeContext);
    expect(response.status).toBe(200);
    expect(mocks.updateDisplay).toHaveBeenCalledTimes(1);
    expect(mocks.updateDisplay.mock.calls[0]?.[2]).toEqual(input);
  });

  it("rejects a large body before authorization-dependent domain mutation", async () => {
    const input = {
      introductionText: "Welcome",
      bodyHtml: "x".repeat(263000),
      takeaways: [],
      thumbnailUrl: null,
      expectedVersion: null,
    };
    const response = await PUT(put(JSON.stringify(input)), routeContext);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.updateDisplay).not.toHaveBeenCalled();
  });

  it("does not accept an attacker-controlled Content-Length as a size override", async () => {
    const response = await PUT(
      put("x".repeat(262145), { "content-length": "1" }), routeContext,
    );
    expect(response.status).toBe(400);
    expect(mocks.updateDisplay).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and invalid nested field shapes before the domain service", async () => {
    const malformed = await PUT(put("{not-json"), routeContext);
    expect(malformed.status).toBe(400);
    const invalid = await PUT(put(JSON.stringify({
      introductionText: "Welcome", bodyHtml: null, takeaways: [],
      thumbnailUrl: "https://127.0.0.1/private", expectedVersion: null,
    })), routeContext);
    expect(invalid.status).not.toBe(200);
    expect(mocks.updateDisplay).not.toHaveBeenCalled();
  });

  it("blocks cross-site requests before examining the body or calling the service", async () => {
    mocks.origin.mockReturnValue(false);
    const response = await PUT(put("{}"), routeContext);
    expect(response.status).toBe(403);
    expect(mocks.updateDisplay).not.toHaveBeenCalled();
  });
});
