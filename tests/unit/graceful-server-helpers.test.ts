import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isDatabaseUnavailableError } from "@/lib/db-outage";
import { friendlyApiError, FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import { createRequestId } from "@/lib/request-id";

const source = (path: string) => readFileSync(path, "utf8");

describe("server error envelope", () => {
  it("GR-05 includes a short reference in server errors and structured logs", () => {
    expect(createRequestId()).toMatch(/^[a-f0-9]{8}$/);
    expect(source("src/lib/api-error.ts")).toContain('headers.set("x-request-id", requestId)');
    expect(source("src/observability/logger.ts")).toContain("requestId");
  });
  it("GR-06 maps domain statuses and never includes unknown error.message", () => {
    const code = source("src/lib/api-error.ts");
    expect(code).toContain("friendlyApiError({ status, code })");
    expect(code).toContain("message: code ===");
    expect(code).toContain("FACULTY_TEACHING_SCOPE_REQUIRED");
    expect(code).not.toContain("error.message");
    expect(code).toContain("error instanceof PlacementsServiceError");
  });
  it("GR-07 maps Zod issues onto field paths", () => {
    const code = source("src/lib/api-error.ts");
    expect(code).toContain("fieldErrors: Object.fromEntries(error.issues");
    expect(code).toContain('issue.path.join(".")');
  });
  it("GR-08 catches both async route handlers and server actions", () => {
    const code = source("src/lib/with-api-guard.ts");
    expect(code).toContain("return apiErrorResponse(error)");
    expect(code).toContain("GuardedActionResult");
  });
  it("GR-18 reports database connectivity failures as safe temporary outages", () => {
    expect(isDatabaseUnavailableError({ cause: { code: "08006" } })).toBe(true);
    expect(isDatabaseUnavailableError({ code: "23505" })).toBe(false);
    expect(friendlyApiError({ status: 503, code: "DATABASE_UNAVAILABLE" }))
      .toBe(FRIENDLY_MESSAGES.databaseUnavailable);
    expect(source("src/lib/api-error.ts")).toContain("isDatabaseUnavailableError(error)");
  });
  it("GR-54 retryable HTTP responses include a short wait", () => {
    expect(source("src/lib/api-error.ts")).toContain('headers.set("Retry-After", "60")');
  });
});
