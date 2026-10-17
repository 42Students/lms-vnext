import { expect, type Page } from "@playwright/test";
import { FRIENDLY_MESSAGES } from "../../../src/lib/friendly-error";

/** GR-81: a product screen must contain useful content, never implementation text. */
const forbidden = [
  /\b(?:INTERNAL_ERROR|DATABASE_UNAVAILABLE|SESSION_EXPIRED|FORBIDDEN|NOT_FOUND|RATE_LIMITED|GATEWAY_TIMEOUT|UNEXPECTED_ERROR|CONFLICT)\b/g,
  /Error:/i, /Exception/i, /ECONN/i, /undefined/i,
  /\bNaN\b/, /\[object/i, /at <anonymous>/i,
  /\bApplication error\b/i,
  /\bat\s+[^\s]+\s+\([^\n]+:\d+:\d+\)/i,
  /\b(?:SELECT|INSERT|UPDATE|DELETE)\s+[^\n]+\b(?:FROM|INTO|SET)\b/i,
  /\brelation\s+["'`][^"'`]+/i,
  /\bviolates\b/i,
  /\bnull\b/i, /\bSQLSTATE\b/i, /Unexpected token/i,
  /\b(?:HTTP|status|error|response)\s*[:#-]?\s*(?:403|404|429|500|502|503|504)\b/i,
  // GR-81: status mappers must not leak previously unseen codes or runtime internals.
  /\b(?:TypeError|ReferenceError|SyntaxError|RangeError|ChunkLoadError|PrismaClient\w*Error|QueryFailedError)\b/,
  /\b(?:ETIMEDOUT|ENOTFOUND|EPIPE|ECONNRESET|ERR_[A-Z0-9_]+)\b/,
  /\b(?:node:internal\/|webpack-internal:\/\/|file:\/\/)\S*|\/_next\/static\/chunks\/\S*/i,
  /\b(?:[Ee]rror|[Cc]ode|[Rr]eason|[Ff]ailed|[Ss]tatus)\s*[:=]\s*[A-Z][A-Z0-9_]{5,}\b/,
  /\{\s*"(?:error|code|stack)"\s*:/i,
];

export async function expectNoRawErrors(page: Page): Promise<void> {
  await expect(page.locator("body")).toBeVisible();
  const body = (await page.locator("body").innerText()).trim();
  expect(body.length, "GR-81: browser page was blank").toBeGreaterThan(25);
  for (const pattern of forbidden) {
    pattern.lastIndex = 0;
    expect(body, `GR-81: leaked implementation detail matching ${pattern}`).not.toMatch(pattern);
  }
  // Scan live regions with textContent, not only accessibility-filtered
  // getByRole(): stale invisible error regions and polite status updates must
  // never retain a raw provider response in the DOM.
  const announced = await page
    .locator('[role="alert"], [role="status"], [aria-live="assertive"], [aria-live="polite"]')
    .all();
  for (const region of announced) {
    const value = (await region.textContent() ?? "").trim();
    for (const pattern of forbidden) {
      pattern.lastIndex = 0;
      expect(value, "GR-81: raw runtime detail in a live region").not.toMatch(pattern);
    }
    expect(value, "GR-81: raw API error identifier in a live region")
      .not.toMatch(/\b[A-Z][A-Z0-9]{2,}_[A-Z][A-Z0-9_]{2,}\b/);
    expect(value, "GR-81: exposed standalone implementation code")
      .not.toMatch(/^(?:[A-Z][A-Z0-9_]{5,}|HTTP\s*[45]\d{2})$/);
  }
  // Text such as a raw SQL error can also leak from an icon's accessible
  // name, a tooltip, or a server-populated placeholder while the visible
  // page body remains completely friendly.
  // A response may leak in image descriptions, ARIA value descriptions, tooltips,
  // or a hidden element named by aria-describedby/aria-labelledby. Checking
  // visible innerText and direct aria-labels alone misses those surfaces.
  const labels = await page.locator(
    "body [aria-label], body [title], body [placeholder], body [alt], " +
    "body [aria-description], body [aria-valuetext], body [data-tooltip], " +
    "body [data-error], body [data-message], body [aria-describedby], body [aria-labelledby]",
  ).evaluateAll((elements) => elements.flatMap((element) => {
    const attributes = [
      "aria-label", "title", "placeholder", "alt", "aria-description",
      "aria-valuetext", "data-tooltip", "data-error", "data-message",
    ];
    const direct = attributes.map(name => element.getAttribute(name))
      .filter((value): value is string => value !== null);
    const related = ["aria-describedby", "aria-labelledby"].flatMap(name =>
      (element.getAttribute(name) ?? "").trim().split(/\s+/).filter(Boolean)
        .map(id => element.ownerDocument.getElementById(id)?.textContent ?? ""));
    return [...direct, ...related];
  }));
  for (const value of labels) {
    for (const pattern of forbidden) {
      pattern.lastIndex = 0;
      expect(value, "GR-81: raw runtime detail in an accessibility attribute")
        .not.toMatch(pattern);
    }
    expect(value, "GR-81: raw API identifier in accessibility attribute")
      .not.toMatch(/\b[A-Z][A-Z0-9]{2,}_[A-Z][A-Z0-9_]{2,}\b/);
  }
  await expect(page.locator("nextjs-portal, vite-error-overlay")).toHaveCount(0);
}

export type FailureKind =
  | "backend-down" | "html-502" | "json-500" | "forbidden"
  | "missing-record" | "conflict" | "rate-limit"
  | "slow" | "maintenance" | "session-expired";

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
      maintenance: { status: 503, code: "SERVICE_UNAVAILABLE" },
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
 * GR-02 exact customer copy directly from the now-merged FRIENDLY_MESSAGES.
 * No duplicated literals: changes to the shared catalog remain immediately
 * visible to every browser assertion.
 */
export const GR02_TEXT: Record<FailureKind, string> = {
  "backend-down": FRIENDLY_MESSAGES.offline,
  "html-502": FRIENDLY_MESSAGES.unexpected,
  "json-500": FRIENDLY_MESSAGES.unexpected,
  forbidden: FRIENDLY_MESSAGES.forbidden,
  "missing-record": FRIENDLY_MESSAGES.missing,
  conflict: FRIENDLY_MESSAGES.conflict,
  "rate-limit": FRIENDLY_MESSAGES.rateLimit,
  slow: FRIENDLY_MESSAGES.timeout,
  maintenance: FRIENDLY_MESSAGES.maintenance,
  "session-expired": FRIENDLY_MESSAGES.session,
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
