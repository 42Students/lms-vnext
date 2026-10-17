import { expect, test } from "@playwright/test";
import { expectNoRawErrors, failApi, GR02_TEXT } from "./support/no-raw-error";

test("GR-81 rejects a raw error code displayed anywhere in the DOM", async ({ page }) => {
  await page.setContent("<main><h1>Something went wrong</h1><p>Request failed. INTERNAL_ERROR</p></main>");
  await expect(expectNoRawErrors(page)).rejects.toThrow();
});

test("GR-81 rejects stack frames, blank content and the framework overlay", async ({ page }) => {
  await page.setContent("<main></main>");
  await expect(expectNoRawErrors(page)).rejects.toThrow();
  await page.setContent("<main><h1>There was a problem</h1><pre>Error: failed at <anonymous></pre></main>");
  await expect(expectNoRawErrors(page)).rejects.toThrow();
});

test("GR-81 accepts actionable customer wording and creates actual intercepts", async ({ page }) => {
  await page.goto("/"); // Establish localhost origin before a relative fetch.
  await page.setContent("<main><h1>Could not load this right now.</h1><p>Please try again in a minute.</p><button>Retry</button></main>");
  await expectNoRawErrors(page);
  const injection = await failApi(page, "**/api/graceful-probe", "json-500");
  const status = await page.evaluate(async () => {
    const response = await fetch("/api/graceful-probe");
    return response.status;
  });
  expect(status).toBe(500);
  expect(injection.hits()).toBe(1);
  expect(injection.requests()).toContain("GET /api/graceful-probe");
  await injection.dispose();
});

test("GR-81 rejects SQL detail, network codes, framework and numerical status text", async ({ page }) => {
  await page.setContent('<main><h1>We had a problem</h1><p>relation "student_private" violates foreign key constraint</p></main>');
  await expect(expectNoRawErrors(page)).rejects.toThrow();
  await page.setContent("<main><h1>There is a problem</h1><p>HTTP 500 INTERNAL_ERROR</p></main>");
  await expect(expectNoRawErrors(page)).rejects.toThrow();
  await page.setContent("<main><h1>Client-side issue</h1><nextjs-portal></nextjs-portal></main>");
  await expect(expectNoRawErrors(page)).rejects.toThrow();
});

test("GR-02 GR-81 copy table covers every browser failure injection", () => {
  expect(Object.keys(GR02_TEXT).sort()).toEqual([
    "backend-down", "html-502", "json-500", "forbidden", "missing-record",
    "conflict", "rate-limit", "maintenance", "slow", "session-expired",
  ].sort());
  for (const copy of Object.values(GR02_TEXT)) {
    expect(copy).toMatch(/[.!]$/);
    expect(copy).not.toMatch(/Error:|Exception|ECONN|relation|violates|INTERNAL_ERROR/);
  }
});
