import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FACULTY_AUTHORING_LIMIT_BYTES,
  readFacultyAuthoringBody,
} from "@/modules/courses/faculty-authoring-request-body";
import { NextResponse } from "next/server";

const stubs = vi.hoisted(() => ({
  origin: vi.fn(),
  context: vi.fn(),
  apiError: vi.fn(),
  live: vi.fn(),
  attendance: vi.fn(),
}));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: stubs.origin }));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: stubs.context }));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: stubs.apiError }));
vi.mock("@/lib/request-id", () => ({ createRequestId: () => "c3saferequest" }));
vi.mock("@/modules/courses/faculty-live-mutation-service", () => ({
  commandFacultyLiveClass: stubs.live,
}));
vi.mock("@/modules/attendance/faculty-schedule-mutation-service", () => ({
  commandFacultyAttendanceSchedule: stubs.attendance,
}));
import { POST as postLive } from "@/app/api/courses/faculty/live-classes/[deliveryId]/command/route";
import { POST as postAttendance } from "@/app/api/courses/faculty/attendance/[deliveryId]/schedule/route";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ deliveryId }) };
function request(body: BodyInit | null, type = "application/json", headers: Record<string, string> = {}) {
  return new Request("https://college.example/api/courses/faculty/schedule", {
    method: "POST", headers: { "content-type": type, ...headers }, body,
  });
}
const handlers = [
  { name: "live class", post: postLive, service: stubs.live },
  { name: "class schedule", post: postAttendance, service: stubs.attendance },
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  stubs.origin.mockReturnValue(true);
  stubs.context.mockResolvedValue({ user: { id: "active-faculty" } });
  stubs.live.mockResolvedValue({ id: "live" });
  stubs.attendance.mockResolvedValue({ id: "attendance" });
  stubs.apiError.mockReturnValue(NextResponse.json({
    error: "FORBIDDEN", message: "This class is not yours.", requestId: "safe",
  }, { status: 403 }));
});

describe("FAC-HTTP-BODY-01 bounded Faculty authoring parser", () => {
  it("accepts Unicode metadata without shifting dates or truncating content", async () => {
    const input = { action: "CREATE", title: "పాఠం", confirmed: true };
    await expect(readFacultyAuthoringBody(request(JSON.stringify(input))))
      .resolves.toEqual(input);
  });

  it("rejects unsupported media types, partial JSON, invalid Content-Length and missing bodies", async () => {
    await expect(readFacultyAuthoringBody(request("{}", "text/plain")))
      .rejects.toMatchObject({ code: "UNSUPPORTED_FACULTY_AUTHORING_CONTENT_TYPE", status: 415 });
    await expect(readFacultyAuthoringBody(request("{")))
      .rejects.toMatchObject({ code: "INVALID_FACULTY_AUTHORING_JSON", status: 400 });
    for (const length of ["-1", "2.5", "NaN", "1e4", "Infinity"]) {
      await expect(readFacultyAuthoringBody(request("{}", "application/json", {
        "content-length": length,
      }))).rejects.toMatchObject({ code: "INVALID_FACULTY_AUTHORING_JSON", status: 400 });
    }
    await expect(readFacultyAuthoringBody(request(null)))
      .rejects.toMatchObject({ code: "INVALID_FACULTY_AUTHORING_JSON", status: 400 });
  });

  it("rejects declared or actual body bytes exceeding the 128KiB cap before a mutation", async () => {
    await expect(readFacultyAuthoringBody(request("{}", "application/json", {
      "content-length": String(FACULTY_AUTHORING_LIMIT_BYTES + 1),
    }))).rejects.toMatchObject({ code: "FACULTY_AUTHORING_BODY_TOO_LARGE", status: 413 });
    await expect(readFacultyAuthoringBody(request(
      "x".repeat(FACULTY_AUTHORING_LIMIT_BYTES + 1),
    ))).rejects.toMatchObject({ code: "FACULTY_AUTHORING_BODY_TOO_LARGE", status: 413 });
  });
});

describe("FAC-HTTP-BODY-02 both Faculty mutation route boundaries", () => {
  for (const { name, post, service } of handlers) {
    it(name + " rejects a foreign origin before auth and a service write", async () => {
      stubs.origin.mockReturnValue(false);
      const response = await post(request("{}"), params);
      expect(response.status).toBe(403);
      expect(stubs.context).not.toHaveBeenCalled();
      expect(service).not.toHaveBeenCalled();
    });

    it(name + " passes the authenticated actor and exact delivery path to the existing service", async () => {
      const body = { action: "CREATE", title: "Safe class", confirmed: true };
      const response = await post(request(JSON.stringify(body)), params);
      expect(response.status).toBe(200);
      expect(service).toHaveBeenCalledWith({ user: { id: "active-faculty" } }, { deliveryId }, body);
    });

    it(name + " returns 400/413/415 with safe recovery and a request reference but never writes", async () => {
      const invalid = [
        { request: request("{"), status: 400, message: "Check the " + name + " details and try again." },
        { request: request("{}", "text/plain"), status: 415, message: "Send the " + name + " request as JSON and try again." },
        { request: request("{}", "application/json", {
          "content-length": String(FACULTY_AUTHORING_LIMIT_BYTES + 1),
        }), status: 413, message: "The " + name + " request is too large. Shorten it and try again." },
      ];
      for (const item of invalid) {
        const response = await post(item.request, params);
        expect(response.status).toBe(item.status);
        expect(response.headers.get("x-request-id")).toBe("c3saferequest");
        expect(await response.json()).toMatchObject({
          message: item.message, requestId: "c3saferequest",
        });
      }
      expect(service).not.toHaveBeenCalled();
    });

    it(name + " preserves canonical service error mapping without leaking internals", async () => {
      service.mockRejectedValueOnce(new Error("private database error details"));
      const response = await post(request("{}"), params);
      expect(response.status).toBe(403);
      expect(JSON.stringify(await response.json())).not.toContain("private database error details");
      expect(stubs.apiError).toHaveBeenCalledOnce();
    });
  }
});
