import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FACULTY_QUIZ_COMMAND_LIMIT_BYTES,
  readFacultyQuizCommandBody,
} from "@/modules/courses/faculty-quiz-request-body";

const stubs = vi.hoisted(() => ({
  origin: vi.fn(),
  context: vi.fn(),
  command: vi.fn(),
  apiError: vi.fn(),
}));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: stubs.origin }));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: stubs.context }));
vi.mock("@/modules/courses/faculty-quiz-authoring-service", () => ({
  commandFacultyQuiz: stubs.command,
}));
vi.mock("@/lib/api-error", () => ({ apiErrorResponse: stubs.apiError }));
vi.mock("@/lib/request-id", () => ({ createRequestId: () => "c3quiz42" }));

import { POST } from "@/app/api/courses/faculty/quizzes/[deliveryId]/command/route";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const url = "https://college.example/api/courses/faculty/quizzes/" + deliveryId + "/command";
const params = { params: Promise.resolve({ deliveryId }) };
function request(body: BodyInit, contentType = "application/json", headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": contentType, ...headers },
    body,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  stubs.origin.mockReturnValue(true);
  stubs.context.mockResolvedValue({ user: { id: "faculty" } });
  stubs.command.mockResolvedValue({ id: "saved-quiz" });
  stubs.apiError.mockReturnValue(Response.json({
    error: "FORBIDDEN", message: "You cannot edit this quiz.", requestId: "safe",
  }, { status: 403 }));
});

describe("FAC-QUIZ-TRANSPORT-01 declared and streaming byte enforcement", () => {
  it("rejects malformed and ambiguous declared lengths before parsing or editing a quiz", async () => {
    for (const length of ["-1", "3.5", "1e10", "NaN", "Infinity", "unsafe"]) {
      await expect(readFacultyQuizCommandBody(request("{}", "application/json", {
        "content-length": length,
      }))).rejects.toMatchObject({ code: "INVALID_QUIZ_JSON", status: 400 });
    }
  });

  it("rejects declared oversized requests, and catches streamed oversized data without a header", async () => {
    await expect(readFacultyQuizCommandBody(request("{}", "application/json", {
      "content-length": String(FACULTY_QUIZ_COMMAND_LIMIT_BYTES + 1),
    }))).rejects.toMatchObject({ code: "FACULTY_QUIZ_BODY_TOO_LARGE", status: 413 });
    await expect(readFacultyQuizCommandBody(request(
      "x".repeat(FACULTY_QUIZ_COMMAND_LIMIT_BYTES + 1),
    ))).rejects.toMatchObject({ code: "FACULTY_QUIZ_BODY_TOO_LARGE", status: 413 });
  });

  it("accepts normal UTF-8 JSON with ordinary decimal Content-Length", async () => {
    const body = JSON.stringify({ title: "Quiz: తెలుగు", confirmed: true });
    await expect(readFacultyQuizCommandBody(request(body, "application/json", {
      "content-length": String(new TextEncoder().encode(body).length),
    }))).resolves.toEqual({ title: "Quiz: తెలుగు", confirmed: true });
  });
});

describe("FAC-QUIZ-TRANSPORT-02 safe quiz mutation failures", () => {
  it("rejects forged origin before any context or mutation work", async () => {
    stubs.origin.mockReturnValue(false);
    const response = await POST(request("{}"), params);
    expect(response.status).toBe(403);
    expect(stubs.context).not.toHaveBeenCalled();
    expect(stubs.command).not.toHaveBeenCalled();
  });

  it("preserves machine-readable codes but supplies a recoverable message and trace reference", async () => {
    const cases = [
      { request: request("{"), status: 400, code: "INVALID_QUIZ_JSON", message: "Check the quiz data and try again." },
      { request: request("{}", "text/plain"), status: 415, code: "UNSUPPORTED_QUIZ_CONTENT_TYPE", message: "Send the quiz as JSON and try again." },
      { request: request("{}", "application/json", {
        "content-length": String(FACULTY_QUIZ_COMMAND_LIMIT_BYTES + 1),
      }), status: 413, code: "FACULTY_QUIZ_BODY_TOO_LARGE", message: "The quiz is too large. Shorten it and try again." },
    ];
    for (const item of cases) {
      const response = await POST(item.request, params);
      expect(response.status).toBe(item.status);
      expect(response.headers.get("x-request-id")).toBe("c3quiz42");
      expect(await response.json()).toMatchObject({
        error: item.code, message: item.message, requestId: "c3quiz42",
      });
    }
    expect(stubs.command).not.toHaveBeenCalled();
  });

  it("does not alter valid authoring payloads or bypass the canonical service error handler", async () => {
    const body = { action: "CREATE", title: "Safe quiz" };
    const response = await POST(request(JSON.stringify(body)), params);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ quiz: { id: "saved-quiz" } });
    expect(stubs.command).toHaveBeenCalledWith({ user: { id: "faculty" } }, { deliveryId }, body);

    stubs.command.mockRejectedValueOnce(new Error("raw internal secret"));
    const failure = await POST(request(JSON.stringify(body)), params);
    expect(failure.status).toBe(403);
    expect(JSON.stringify(await failure.json())).not.toContain("raw internal secret");
    expect(stubs.apiError).toHaveBeenCalledOnce();
  });
});
