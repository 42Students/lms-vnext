import { expect, test } from "@playwright/test";
import { expectNoRawErrors, failApi, type FailureKind } from "./support/no-raw-error";

/**
 * GR-81 negative controls: unlike journey tests, these deliberately display
 * hostile server text. Each case must make the shared DOM gate fail. The page
 * is a local synthetic fixture: none of these cases touches customer data.
 */
const leaks = [
  ["known internal status", "INTERNAL_ERROR"],
  ["database unavailable code", "DATABASE_UNAVAILABLE"],
  ["session expired code", "SESSION_EXPIRED"],
  ["authorization code", "FORBIDDEN"],
  ["missing-record code", "NOT_FOUND"],
  ["rate-limit code", "RATE_LIMITED"],
  ["gateway timeout code", "GATEWAY_TIMEOUT"],
  ["unexpected server code", "UNEXPECTED_ERROR"],
  ["conflict code", "CONFLICT"],
  ["unrecognized underscore code", "NETWORK_FAILURE"],
  ["unrecognized validation code", "VALIDATION_FAILED"],
  ["embedded arbitrary code", "Request failed: API_TOKEN_INVALID"],
  ["error prefix", "Error: failed to save"],
  ["type error", "TypeError: failed to fetch"],
  ["reference error", "ReferenceError: token is not defined"],
  ["syntax error", "SyntaxError: invalid JSON"],
  ["range error", "RangeError: invalid length"],
  ["stale chunk error", "ChunkLoadError: Loading chunk 9 failed"],
  ["database driver error", "PrismaClientKnownRequestError"],
  ["query library error", "QueryFailedError"],
  ["connection refused", "ECONNREFUSED 127.0.0.1"],
  ["request timed out", "ETIMEDOUT upstream"],
  ["DNS lookup", "ENOTFOUND service.example"],
  ["browser network identifier", "ERR_NETWORK"],
  ["undefined value", "undefined"],
  ["not-a-number", "NaN"],
  ["object coercion", "[object Object]"],
  ["anonymous stack frame", "at &lt;anonymous&gt;"],
  ["named stack frame", "at handleSave (src/page.tsx:18:3)"],
  ["framework failure", "Application error"],
  ["SQL query", "SELECT * FROM private_students"],
  ["SQL relation", "relation &quot;private_students&quot; does not exist"],
  ["SQL constraint", "violates unique constraint"],
  ["database SQLSTATE", "SQLSTATE 23505"],
  ["HTML parse crash", "Unexpected token &lt; in JSON"],
  ["proxy status", "HTTP 502"],
  ["status number", "status: 503"],
  ["null server field", "null"],
  ["node internals", "node:internal/modules/esm/resolve"],
  ["webpack internals", "webpack-internal:///app/page"],
  ["source chunk path", "/_next/static/chunks/main-app.js"],
  ["raw JSON response", '{"error":"SECRET_FAILURE"}'],
] as const;

for (const [label, leak] of leaks) {
  test(`GR-81 blocks ${label} from an announced browser error`, async ({ page }) => {
    await page.setContent(`<main><h1>Try again</h1><div role="alert">${leak}</div><a href="/">Go home</a></main>`);
    await expect(expectNoRawErrors(page)).rejects.toThrow();
  });
}

test("GR-81 allows uppercase role labels and customer text without codes", async ({ page }) => {
  await page.setContent(`<main>
    <h1>Recruiter preferences</h1>
    <p>ADMIN FACULTY MENTOR PUBLISHED</p>
    <p role="status">Your changes are kept.</p>
    <div role="alert">This changed while you were working. Refresh and try again.</div>
    <a href="/">Go home</a>
  </main>`);
  await expectNoRawErrors(page);
});

test("GR-81 permits an eight-character support reference without exposing a stack", async ({ page }) => {
  await page.setContent(`<main>
    <h1>Could not save</h1>
    <div role="alert">Something went wrong on our side. Please try again in a moment.</div>
    <p>Reference: ab12cd34</p><button>Copy reference</button><a href="/">Go home</a>
  </main>`);
  await expectNoRawErrors(page);
});

/**
 * GR-80/81 injection fixture audit: prove every HTTP fault reaches the intended
 * POST before interpreting any branded product outcome. This is NOT a substitute
 * for the signed-in end-to-end role journeys.
 */
const statuses: ReadonlyArray<{ kind: FailureKind; status: number; code: string }> = [
  { kind: "html-502", status: 502, code: "" },
  { kind: "json-500", status: 500, code: "INTERNAL_ERROR" },
  { kind: "forbidden", status: 403, code: "FORBIDDEN" },
  { kind: "missing-record", status: 404, code: "NOT_FOUND" },
  { kind: "conflict", status: 409, code: "CONFLICT" },
  { kind: "rate-limit", status: 429, code: "RATE_LIMITED" },
  { kind: "maintenance", status: 503, code: "SERVICE_UNAVAILABLE" },
  { kind: "session-expired", status: 401, code: "SESSION_EXPIRED" },
];

for (const entry of statuses) {
  test(`GR-80 GR-81 ${entry.kind} interceptor returns ${entry.status} to one real POST`,
    async ({ page }) => {
      await page.goto("/");
      const injection = await failApi(page, "**/api/graceful-fault-probe", entry.kind);
      try {
        const response = await page.evaluate(async () => {
          const result = await fetch("/api/graceful-fault-probe", { method: "POST" });
          return { status: result.status, type: result.headers.get("content-type"),
            retryAfter: result.headers.get("retry-after"),
            requestId: result.headers.get("x-request-id"),
            text: await result.text() };
        });
        expect(response.status).toBe(entry.status);
        expect(injection.hits()).toBe(1);
        expect(injection.requests()).toEqual(["POST /api/graceful-fault-probe"]);
        if (entry.kind === "html-502") {
          expect(response.type).toContain("text/html");
          expect(response.text).toContain("502 Bad Gateway");
        } else {
          expect(response.type).toContain("application/json");
          expect(JSON.parse(response.text).error).toBe(entry.code);
          expect(response.requestId).toBe("ab12cd34");
        }
        if (entry.kind === "rate-limit") expect(response.retryAfter).toBe("60");
      } finally {
        await injection.dispose();
      }
    });
}

test("GR-80 GR-81 backend-down interceptor fails a real POST without an HTTP body", async ({ page }) => {
  await page.goto("/");
  const injection = await failApi(page, "**/api/graceful-fault-probe", "backend-down");
  try {
    const result = await page.evaluate(async () => {
      try {
        await fetch("/api/graceful-fault-probe", { method: "POST" });
        return "unexpected-success";
      } catch {
        return "network-failed";
      }
    });
    expect(result).toBe("network-failed");
    expect(injection.hits()).toBe(1);
    expect(injection.requests()).toEqual(["POST /api/graceful-fault-probe"]);
  } finally {
    await injection.dispose();
  }
});
