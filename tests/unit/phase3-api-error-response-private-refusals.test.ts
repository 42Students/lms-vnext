import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiErrorResponse } from "@/lib/api-error";
import { SessionAuthenticationError } from "@/auth/session";
import { AuthorizationError } from "@/modules/permissions/policy";
import { logError } from "@/observability/logger";

vi.mock("@/observability/logger", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/observability/logger")>();
  return { ...original, logError: vi.fn() };
});

const SECRET_URL = "postgresql://lms_user:Sup3rS3cret@10.180.16.3:5432/lms_vnext";

async function read(response: Response) {
  const text = await response.text();
  return { status: response.status, text, json: JSON.parse(text) as Record<string, unknown>, headers: response.headers };
}

describe("Phase 3: refused Super Admin calls reveal nothing useful", () => {
  beforeEach(() => vi.mocked(logError).mockClear());

  it("a missing permission is a generic 403 that never names the permission", async () => {
    for (const permission of ["system-role.manage", "admin-scope.select", "college.manage", "organization.manage"] as const) {
      const { status, text, json } = await read(apiErrorResponse(new AuthorizationError(permission)));
      expect(status).toBe(403);
      expect(json["error"]).toBe("FORBIDDEN");
      expect(text).not.toContain(permission);
      expect(text).not.toContain("Missing permission");
    }
  });

  it("every refusal carries a request id in the body and the x-request-id header, and they match", async () => {
    const { json, headers } = await read(apiErrorResponse(new AuthorizationError("college.manage")));
    expect(typeof json["requestId"]).toBe("string");
    expect(headers.get("x-request-id")).toBe(json["requestId"]);
  });

  it("a refusal still carries a customer-safe message", async () => {
    const { json } = await read(apiErrorResponse(new AuthorizationError("college.manage")));
    expect(typeof json["message"]).toBe("string");
    expect((json["message"] as string).length).toBeGreaterThan(5);
  });

  it("an invalid or expired session is 401 and does not echo the reason beyond its code", async () => {
    const { status, json, text } = await read(apiErrorResponse(new SessionAuthenticationError("SESSION_INVALID")));
    expect(status).toBe(401);
    expect(json["error"]).toBe("SESSION_INVALID");
    expect(text).not.toMatch(/stack|at .*\(.*:\d+:\d+\)/);
  });

  it("an unexpected error becomes a generic 500 and never echoes its message, stack or connection string", async () => {
    const boom = new Error(`connect ECONNREFUSED ${SECRET_URL}`);
    boom.stack = `Error: boom\n    at secretFunction (/app/src/modules/x.ts:10:5)`;
    const { status, text, json } = await read(apiErrorResponse(boom));
    expect([500, 503]).toContain(status);
    expect(["INTERNAL_ERROR", "DATABASE_UNAVAILABLE"]).toContain(json["error"]);
    for (const leak of [SECRET_URL, "Sup3rS3cret", "lms_user", "10.180.16.3", "secretFunction", "/app/src"]) {
      expect(text, `response leaked ${leak}`).not.toContain(leak);
    }
  });

  it("the unexpected error is logged server-side with the same request id", async () => {
    const { json } = await read(apiErrorResponse(new Error("internal detail")));
    expect(logError).toHaveBeenCalledTimes(1);
    const [event, , context] = vi.mocked(logError).mock.calls[0]!;
    expect(event).toBe("api.unhandled_error");
    expect((context as { requestId?: string }).requestId).toBe(json["requestId"]);
  });

  it("a thrown non-Error value is handled without leaking it", async () => {
    const { status, text } = await read(apiErrorResponse(`token=${SECRET_URL}`));
    expect([500, 503]).toContain(status);
    expect(text).not.toContain("Sup3rS3cret");
  });

  it("an authorization failure is never logged as an unhandled error", async () => {
    await read(apiErrorResponse(new AuthorizationError("college.manage")));
    expect(logError).not.toHaveBeenCalled();
  });
});
