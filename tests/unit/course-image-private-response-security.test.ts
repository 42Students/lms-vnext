import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  context: vi.fn(), origin: vi.fn(),
  read: vi.fn(), status: vi.fn(),
  complete: vi.fn(), grant: vi.fn(), remove: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: m.context }));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: m.origin }));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => Response.json({ error: "FORBIDDEN" }, { status: 403 }),
}));
vi.mock("@/modules/courses/course-image-service", () => ({
  CourseImageError: class CourseImageError extends Error {},
  grantCourseImage: m.grant,
  readCourseImage: m.read,
  removeCourseImage: m.remove,
  getCourseImageStatus: m.status,
  completeCourseImage: m.complete,
}));

import {
  GET as downloadCourseImage,
  POST as requestCourseImageUpload,
  DELETE as removeCourseImage,
} from "@/app/api/courses/[courseId]/image/route";
import { GET as courseImageStatus } from "@/app/api/courses/[courseId]/image/status/route";
import { POST as completeCourseImage } from "@/app/api/courses/[courseId]/image/complete/route";

const courseId = "550e8400-e29b-41d4-a716-446655440000";
const receiptId = "550e8400-e29b-41d4-a716-446655440001";
const context = { params: Promise.resolve({ courseId }) };
const base = "https://tenant.example.edu/api/courses/" + courseId + "/image";
function req(method: "GET" | "POST" | "DELETE", suffix = "", body?: string) {
  return new Request(base + suffix, {
    method,
    headers: { host: "tenant.example.edu", origin: "https://tenant.example.edu" },
    ...(body === undefined ? {} : { body }),
  });
}
function expectPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("vary")).toContain("Cookie");
}
describe("verified course image session cache boundaries", () => {
  beforeEach(() => {
    for (const f of Object.values(m)) f.mockReset();
    m.context.mockResolvedValue({ user: { id: "tenant-actor" } });
    m.origin.mockReturnValue(true);
    m.read.mockResolvedValue({
      body: new Uint8Array([137, 80, 78, 71]),
      contentType: "image/png",
    });
    m.status.mockResolvedValue({ ready: true, pending: null });
    m.complete.mockResolvedValue({ status: "READY", imageUrl: null });
    m.grant.mockResolvedValue({ uploadUrl: "https://cdn.example.edu/upload" });
    m.remove.mockResolvedValue({ removed: true });
  });
  it("does not cache authorized image bytes and disables HTML interpretation", async () => {
    const response = await downloadCourseImage(req("GET"), context);
    expect(response.status).toBe(200);
    expectPrivate(response);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("sandbox");
    expect(response.headers.get("content-type")).toBe("image/png");
  });
  it("does not cache denied image reads", async () => {
    m.read.mockRejectedValue(new Error("FORBIDDEN"));
    const response = await downloadCourseImage(req("GET"), context);
    expect(response.status).toBe(403);
    expectPrivate(response);
  });
  it("does not cache successful or denied scan-status reads", async () => {
    const good = await courseImageStatus(req("GET", "/status"), context);
    expect(good.status).toBe(200);
    expectPrivate(good);
    m.status.mockRejectedValue(new Error("FORBIDDEN"));
    const denied = await courseImageStatus(req("GET", "/status"), context);
    expect(denied.status).toBe(403);
    expectPrivate(denied);
  });
  it("does not cache successful or denied upload grants", async () => {
    const good = await requestCourseImageUpload(req("POST", "", JSON.stringify({
      originalName: "cover.png", contentType: "image/png", sizeBytes: 100,
    })), context);
    expect(good.status).toBe(201);
    expectPrivate(good);
    m.grant.mockRejectedValue(new Error("FORBIDDEN"));
    const denied = await requestCourseImageUpload(req("POST", "", "{}"), context);
    expect(denied.status).toBe(403);
    expectPrivate(denied);
  });
  it("does not cache successful or denied image-completion reports", async () => {
    const good = await completeCourseImage(req("POST", "/complete",
      JSON.stringify({ receiptId })), context);
    expect(good.status).toBe(200);
    expectPrivate(good);
    m.complete.mockRejectedValue(new Error("FORBIDDEN"));
    const denied = await completeCourseImage(req("POST", "/complete",
      JSON.stringify({ receiptId })), context);
    expect(denied.status).toBe(403);
    expectPrivate(denied);
  });
  it("does not cache deletion or denied cross-site removal requests", async () => {
    const good = await removeCourseImage(req("DELETE"), context);
    expect(good.status).toBe(200);
    expectPrivate(good);
    m.origin.mockReturnValue(false);
    const denied = await removeCourseImage(req("DELETE"), context);
    expect(denied.status).toBe(403);
    // The central route() wrapper answers the cross-site denial itself: no-store, but no image-specific Vary header.
    expect(denied.headers.get("cache-control")).toBe("private, no-store");
    expect(await denied.json()).toEqual({ error: "INVALID_ORIGIN" });
    expect(m.remove).toHaveBeenCalledTimes(1);
  });
});
