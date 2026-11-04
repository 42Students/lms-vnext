import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  origin: vi.fn(),
  grant: vi.fn(),
  complete: vi.fn(),
  read: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: mocks.context,
}));
vi.mock("@/auth/origin", () => ({
  isSameOriginRequest: mocks.origin,
}));
vi.mock("@/modules/courses/course-image-service", () => ({
  CourseImageError: class CourseImageError extends Error {},
  grantCourseImage: mocks.grant,
  completeCourseImage: mocks.complete,
  readCourseImage: mocks.read,
  removeCourseImage: mocks.remove,
}));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => new Response(null, { status: 500 }),
}));

import { POST as requestImageGrant } from "@/app/api/courses/[courseId]/image/route";
import { POST as completeImage } from "@/app/api/courses/[courseId]/image/complete/route";

const courseId = "550e8400-e29b-41d4-a716-446655440000";
const receiptId = "550e8400-e29b-41d4-a716-446655440001";
const routeContext = { params: Promise.resolve({ courseId }) };

function post(path: string, body: string, headers: Record<string, string> = {}) {
  return new Request("https://lms.example.edu" + path, {
    method: "POST",
    headers: {
      host: "lms.example.edu",
      origin: "https://lms.example.edu",
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
}

describe("course image write HTTP body boundaries", () => {
  beforeEach(() => {
    for (const fn of Object.values(mocks)) fn.mockReset();
    mocks.origin.mockReturnValue(true);
    mocks.context.mockResolvedValue({ user: { id: "authenticated" } });
    mocks.grant.mockResolvedValue({ uploadUrl: "https://cdn.example.edu/upload" });
    mocks.complete.mockResolvedValue({ status: "READY", imageUrl: null });
  });

  it("accepts a small valid upload declaration after authentication", async () => {
    const input = { originalName: "course.png", contentType: "image/png", sizeBytes: 100 };
    const response = await requestImageGrant(
      post("/api/courses/" + courseId + "/image", JSON.stringify(input)), routeContext,
    );
    expect(response.status).toBe(201);
    expect(mocks.grant).toHaveBeenCalledTimes(1);
    expect(mocks.grant.mock.calls[0]?.[2]).toEqual(input);
  });

  it("refuses an oversized upload declaration before calling the grant service", async () => {
    const response = await requestImageGrant(
      post("/api/courses/" + courseId + "/image", JSON.stringify({ blob: "x".repeat(5000) })),
      routeContext,
    );
    expect(response.status).toBe(400);
    expect(mocks.grant).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("refuses falsified Content-Length even when the actual streamed body is larger", async () => {
    const response = await requestImageGrant(
      post("/api/courses/" + courseId + "/image", "x".repeat(5000), { "content-length": "1" }),
      routeContext,
    );
    expect(response.status).toBe(400);
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  it("rejects foreign origins before consuming upload JSON", async () => {
    mocks.origin.mockReturnValue(false);
    const response = await requestImageGrant(
      post("/api/courses/" + courseId + "/image", "{}"), routeContext,
    );
    expect(response.status).toBe(403);
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  it("completes a valid uploaded receipt after parsing the bounded JSON", async () => {
    const response = await completeImage(
      post("/api/courses/" + courseId + "/image/complete", JSON.stringify({ receiptId })),
      routeContext,
    );
    expect(response.status).toBe(200);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
    expect(mocks.complete.mock.calls[0]?.[2]).toBe(receiptId);
  });

  it("does not touch the image-completion service for over-limit or invalid JSON", async () => {
    for (const body of [JSON.stringify({ receiptId, padding: "x".repeat(2100) }), "{broken"]) {
      const response = await completeImage(
        post("/api/courses/" + courseId + "/image/complete", body), routeContext,
      );
      expect(response.status).toBe(400);
    }
    expect(mocks.complete).not.toHaveBeenCalled();
  });
});
