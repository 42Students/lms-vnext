import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import {
  FACULTY_ASSIGNMENT_COMMAND_LIMIT_BYTES,
  FacultyAssignmentBodyError,
  facultyAssignmentAcceptsContentType,
  readFacultyAssignmentCommandBody,
} from "@/modules/courses/faculty-assignment-request-body";

const dependencies = vi.hoisted(() => ({
  origin: vi.fn(),
  context: vi.fn(),
  command: vi.fn(),
  apiError: vi.fn(),
}));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: dependencies.origin }));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: dependencies.context }));
vi.mock("@/modules/courses/faculty-assignment-authoring-service", () => ({
  commandFacultyAssignment: dependencies.command,
}));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: dependencies.apiError }));
vi.mock("@/lib/request-id", () => ({ createRequestId: () => "c3request" }));

import { POST } from "@/app/api/courses/faculty/assignments/[deliveryId]/command/route";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ deliveryId }) };
const url = "https://college.example/api/courses/faculty/assignments/" + deliveryId + "/command";
function request(body: BodyInit | null, contentType = "application/json", headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": contentType, ...headers },
    body,
  });
}

describe("FAC-assignment-body-01 bounded authoring input", () => {
  it("accepts JSON and +json media types but no form/plain-content type bypass", () => {
    for (const valid of [
      "application/json", "application/json; charset=utf-8", "application/vnd.course+json",
    ]) expect(facultyAssignmentAcceptsContentType(valid)).toBe(true);
    for (const invalid of [null, "text/plain", "multipart/form-data", "application/jsonp"])
      expect(facultyAssignmentAcceptsContentType(invalid)).toBe(false);
  });

  it("parses a valid multi-byte UTF-8 payload without corrupting the description", async () => {
    const body = { action: "CREATE", title: "తెలుగు — Faculty", confirmed: true };
    await expect(readFacultyAssignmentCommandBody(request(JSON.stringify(body))))
      .resolves.toEqual(body);
  });

  it("rejects declared oversize before reading and rejects undeclared oversize while streaming", async () => {
    const code = "ASSIGNMENT_BODY_TOO_LARGE";
    await expect(readFacultyAssignmentCommandBody(request("{}", "application/json", {
      "content-length": String(FACULTY_ASSIGNMENT_COMMAND_LIMIT_BYTES + 1),
    }))).rejects.toMatchObject({ code, status: 413 });
    await expect(readFacultyAssignmentCommandBody(request(
      "x".repeat(FACULTY_ASSIGNMENT_COMMAND_LIMIT_BYTES + 1),
    ))).rejects.toMatchObject({ code, status: 413 });
  });

  it("rejects unsupported formats, malformed content-length, incomplete JSON and invalid UTF-8", async () => {
    await expect(readFacultyAssignmentCommandBody(request("{}", "text/plain")))
      .rejects.toMatchObject({ code: "UNSUPPORTED_ASSIGNMENT_CONTENT_TYPE", status: 415 });
    for (const length of ["broken", "-1", "1.2", "1e2"]) {
      await expect(readFacultyAssignmentCommandBody(request("{}", "application/json", {
        "content-length": length,
      }))).rejects.toMatchObject({ code: "INVALID_ASSIGNMENT_JSON", status: 400 });
    }
    await expect(readFacultyAssignmentCommandBody(request("{")))
      .rejects.toMatchObject({ code: "INVALID_ASSIGNMENT_JSON", status: 400 });
    await expect(readFacultyAssignmentCommandBody(request(
      new Uint8Array([0xc3, 0x28]).buffer,
    ))).rejects.toMatchObject({ code: "INVALID_ASSIGNMENT_JSON", status: 400 });
    await expect(readFacultyAssignmentCommandBody(request(null)))
      .rejects.toMatchObject({ code: "INVALID_ASSIGNMENT_JSON", status: 400 });
  });

  it("preserves typed failure status and code for safe route mapping", async () => {
    const failure = new FacultyAssignmentBodyError("ASSIGNMENT_BODY_TOO_LARGE", 413);
    expect(failure).toMatchObject({ name: "FacultyAssignmentBodyError", status: 413 });
  });
});

describe("FAC-assignment-body-02 Faculty route authoring transport", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dependencies.origin.mockReturnValue(true);
    dependencies.context.mockResolvedValue({ user: { id: "faculty" } });
    dependencies.command.mockResolvedValue({ id: "assignment-1" });
    dependencies.apiError.mockReturnValue(NextResponse.json({
      error: "INTERNAL_ERROR", message: "Try again.", requestId: "other",
    }, { status: 500 }));
  });

  it("rejects forged cross-site POST before resolving a session or writing", async () => {
    dependencies.origin.mockReturnValue(false);
    const response = await POST(request("{}"), params);
    expect(response.status).toBe(403);
    expect(dependencies.context).not.toHaveBeenCalled();
    expect(dependencies.command).not.toHaveBeenCalled();
  });

  it("passes only authenticated context, delivery path and validated transport JSON to the command", async () => {
    const body = { action: "CREATE", title: "Secure assignment" };
    const response = await POST(request(JSON.stringify(body)), params);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ assignment: { id: "assignment-1" } });
    expect(dependencies.command).toHaveBeenCalledWith(
      { user: { id: "faculty" } }, { deliveryId }, body,
    );
  });

  it("never invokes a write on malformed, unsupported or oversize requests and returns friendly recovery", async () => {
    const cases = [
      { request: request("{"), status: 400, message: "Check the assignment data and try again." },
      { request: request("{}", "text/plain"), status: 415, message: "Send the assignment as JSON and try again." },
      {
        request: request("x".repeat(FACULTY_ASSIGNMENT_COMMAND_LIMIT_BYTES + 1)),
        status: 413, message: "The assignment is too large. Shorten it and try again.",
      },
    ];
    for (const entry of cases) {
      const response = await POST(entry.request, params);
      expect(response.status).toBe(entry.status);
      expect(response.headers.get("x-request-id")).toBe("c3request");
      expect(await response.json()).toMatchObject({
        message: entry.message, requestId: "c3request",
      });
    }
    expect(dependencies.command).not.toHaveBeenCalled();
  });

  it("lets the canonical error mapper handle service authorization and stale-version conflicts", async () => {
    dependencies.command.mockRejectedValue(new Error("protected database detail"));
    const response = await POST(request("{}"), params);
    expect(response.status).toBe(500);
    expect(dependencies.apiError).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(await response.json())).not.toContain("protected database detail");
  });
});
