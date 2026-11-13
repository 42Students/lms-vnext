import { CACHE_PIN } from "../support/cache-pin";
import { describe, expect, it } from "vitest";
import { exportedMethods, hopSources, read, rel, routeFiles } from "./phase3-scan-helpers";

/**
 * Super Admin GET responses carry people, account and tenant data. A shared
 * proxy or the browser must never reuse one person's response for another, so
 * every admin GET route has to reach a `no-store` cache header within two hops.
 * Non-GET responses are never cached by browsers or proxies and are not part
 * of this contract.
 */
const ADMIN_GET = routeFiles("src/app/api/admin")
  .map((abs) => ({ abs, file: rel(abs), methods: exportedMethods(read(abs)) }))
  .filter((r) => r.methods.includes("GET"));

const NO_STORE = /no-store/;

/** GET routes that return no private data; each needs a reason. */
const EXEMPT: Record<string, string> = {};

describe("Phase 3: Super Admin GET responses are private and not cached", () => {
  it("finds the admin GET routes", () => {
    expect(ADMIN_GET.length).toBeGreaterThan(40);
  });

  it("each admin GET route reaches a no-store header within two hops", () => {
    const cached = ADMIN_GET.filter(({ abs, file }) => !(file in EXEMPT) && !NO_STORE.test(hopSources(abs, 2))).map(
      (r) => r.file,
    );
    expect(cached, `admin GET routes that may be cached: ${cached.join(", ")}`).toEqual([]);
  });

  it("the three routes fixed in Phase 3 keep their private no-store header on the success response", () => {
    expect(read("src/app/api/admin/hr/options/route.ts")).toMatch(CACHE_PIN);
    expect(read("src/app/api/admin/hr/[userId]/route.ts")).toMatch(CACHE_PIN);
    expect(read("src/app/api/admin/onboarding/resolve-preview/route.ts")).toMatch(CACHE_PIN);
  });

  it("no admin route opts into static or time-based caching", () => {
    const cachedRoutes = routeFiles("src/app/api/admin")
      .map((abs) => ({ file: rel(abs), src: read(abs) }))
      .filter(({ src }) => /dynamic\s*=\s*["']force-static["']|revalidate\s*=\s*[1-9]|s-maxage|public,\s*max-age/.test(src))
      .map((r) => r.file);
    expect(cachedRoutes, `routes opting into caching: ${cachedRoutes.join(", ")}`).toEqual([]);
  });

  it("every exemption has a written reason and names an existing route", () => {
    for (const [file, reason] of Object.entries(EXEMPT)) {
      expect(reason.length, `${file} needs a reason`).toBeGreaterThan(20);
      expect(ADMIN_GET.some((r) => r.file === file)).toBe(true);
    }
  });
});
