import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

/**
 * The /e2e/* pages are development-only test harnesses (and are exempt from the UI consistency
 * guard for that reason). They must never be served by a production build: the request proxy answers
 * a plain 404 before any page renders.
 */
function call(path: string) {
  return proxy(new NextRequest("https://vnext.example.test" + path));
}

describe("SEC-12/16 test harness pages are not served in production", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("answers 404 for /e2e and everything under it in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const path of ["/e2e", "/e2e/", "/e2e/ux-g135-contact-profile", "/e2e/ux-five-route-recovery"]) {
      const response = call(path);
      expect(response.status, path).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("does not block similarly named public paths", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(call("/e2e-guide").status).not.toBe(404);
  });

  it("is the reason the UI consistency guard skips src/app/e2e", async () => {
    const { readFileSync } = await import("node:fs");
    expect(readFileSync("scripts/check-ui-consistency.mjs", "utf8")).toContain('path.startsWith("src/app/e2e/")');
  });

  it("leaves the harness reachable for the development server", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(call("/e2e/ux-g135-contact-profile").status).not.toBe(404);
  });
});
