import { expect, type Page } from "@playwright/test";

/** GR-81: a product screen must contain useful content, never implementation text. */
const forbidden = [
  /\b[A-Z0-9_]{6,}\b/g,
  /Error:/i, /Exception/i, /ECONN/i, /undefined/i,
  /\bNaN\b/, /\[object/i, /at <anonymous>/i,
  /\bApplication error\b/i,
  /\bat\s+[^\s]+\s+\([^\n]+:\d+:\d+\)/i,
  /\b(?:SELECT|INSERT|UPDATE|DELETE)\s+[^\n]+\b(?:FROM|INTO|SET)\b/i,
  /\brelation\s+["'`][^"'`]+/i,
  /\bviolates\b/i,
  /\bnull\b/i, /\bSQLSTATE\b/i, /Unexpected token/i,
  /\b(?:HTTP\s*)?(?:403|404|429|500|502|503|504)\b/i,
];

export async function expectNoRawErrors(page: Page): Promise<void> {
  await expect(page.locator("body")).toBeVisible();
  const body = (await page.locator("body").innerText()).trim();
  expect(body.length, "GR-81: browser page was blank").toBeGreaterThan(25);
  for (const pattern of forbidden) {
    pattern.lastIndex = 0;
    expect(body, `GR-81: leaked implementation detail matching ${pattern}`).not.toMatch(pattern);
  }
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
}

export type FailureKind =
  | "backend-down" | "html-502" | "json-500" | "forbidden"
  | "missing-record" | "conflict" | "rate-limit"
  | "slow" | "session-expired";

/** Intercepts real /api requests. The calling test MUST assert hits() > 0. */
export async function failApi(
  page: Page,
  matcher: string | RegExp,
  kind: FailureKind,
): Promise<{ hits: () => number; requests: () => readonly string[]; dispose: () => Promise<void> }> {
  let count = 0;
  const matchedRequests: string[] = [];
  const intercept: Parameters<Page["route"]>[1] = async (route) => {
    count += 1;
    matchedRequests.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    if (kind === "backend-down") {
      await route.abort("failed");
      return;
    }
    if (kind === "html-502") {
      await route.fulfill({
        status: 502, contentType: "text/html",
        body: "<!doctype html><html><body><h1>502 Bad Gateway</h1></body></html>",
      });
      return;
    }
    if (kind === "slow") {
      await new Promise<void>((resolve) => setTimeout(resolve, 5_000));
    }
    const response = {
      "json-500": { status: 500, code: "INTERNAL_ERROR" },
      forbidden: { status: 403, code: "FORBIDDEN" },
      "missing-record": { status: 404, code: "NOT_FOUND" },
      conflict: { status: 409, code: "CONFLICT" },
      "rate-limit": { status: 429, code: "RATE_LIMITED" },
      "session-expired": { status: 401, code: "SESSION_EXPIRED" },
      slow: { status: 504, code: "GATEWAY_TIMEOUT" },
    }[kind];
    const requestId = "ab12cd34";
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      headers: {
        "x-request-id": requestId,
        ...(kind === "rate-limit" ? { "retry-after": "60" } : {}),
      },
      body: JSON.stringify({
        error: response.code,
        code: response.code,
        message: "relation \"secret_table\" violates an internal constraint",
        requestId,
      }),
    });
  };
  await page.route(matcher, intercept);
  return {
    hits: () => count,
    requests: () => matchedRequests,
    dispose: () => page.unroute(matcher, intercept),
  };
}

export function captureUncaughtErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const value = message.text();
    // Chromium itself logs the synthetic HTTP 4xx/5xx or aborted resource.
    // These are the injected failures, not an unhandled application exception.
    if (/^Failed to load resource: (?:the server responded with a status of|net::ERR_)/i.test(value)) return;
    errors.push(value);
  });
  return errors;
}

/**
 * GR-02 exact customer copy from chat-14's FRIENDLY_MESSAGES catalog.
 * Keep literals here until chat-14 has merged to main; importing unfinished
 * branch-only helpers would make this lane uncompilable.
 */
export const GR02_TEXT: Record<FailureKind, string> = {
  "backend-down": "You appear to be offline. Check your connection and try again.",
  "html-502": "Something went wrong on our side. Please try again in a moment.",
  "json-500": "Something went wrong on our side. Please try again in a moment.",
  forbidden: "You do not have permission to do this. Please contact your administrator if needed.",
  "missing-record": "We could not find that. Please refresh and try again.",
  conflict: "This changed while you were working. Refresh and try again.",
  "rate-limit": "Too many attempts. Please wait a minute and try again.",
  slow: "This is taking longer than expected. Please try again.",
  "session-expired": "Your session has ended. Please sign in again.",
};
export async function expectFriendlyFailure(
  page: Page, kind: FailureKind,
): Promise<void> {
  // Match exactly inside an announced failure, rather than coincidentally
  // finding "try again" in a static help paragraph elsewhere on the page.
  await expect(page.getByRole("alert").filter({ hasText: GR02_TEXT[kind] }).first())
    .toBeVisible({ timeout: 15_000 });
  await expectNoRawErrors(page);
}
