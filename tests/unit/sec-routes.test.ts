import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTES, fixedRoutes } from "@/lib/routes";

const appDir = path.join(process.cwd(), "src/app");

/** True when src/app has a page for the path, directly or under a route group such as (authenticated). */
function pageExists(route: string): boolean {
  const segments = route.split("/").filter(Boolean);
  const candidates = [appDir, path.join(appDir, "(authenticated)"), path.join(appDir, "(public)")];
  return candidates.some((base) => existsSync(path.join(base, ...segments, "page.tsx")) || existsSync(path.join(base, ...segments, "page.ts")));
}

describe("typed routes", () => {
  it("every fixed route is a real page", () => {
    const missing = fixedRoutes().filter((route) => !pageExists(route));
    expect(missing).toEqual([]);
  });
  it("every parameterised route resolves to a real dynamic page", () => {
    const samples = [
      ROUTES.college.placementJob("00000000-0000-4000-8000-000000000001"),
      ROUTES.admin.placementJob("00000000-0000-4000-8000-000000000001"),
      ROUTES.admin.college("00000000-0000-4000-8000-000000000001"),
      ROUTES.tpo.placementJob("00000000-0000-4000-8000-000000000001"),
      ROUTES.tpo.batch("00000000-0000-4000-8000-000000000001"),
      ROUTES.tpo.company("00000000-0000-4000-8000-000000000001"),
    ];
    for (const sample of samples) {
      const parent = sample.split("/").slice(0, -1).join("/");
      const dir = path.join(appDir, "(authenticated)", ...parent.split("/").filter(Boolean));
      const hasDynamicChild =
        existsSync(dir) &&
        readdirSync(dir).some((name: string) => /^\[[^\]]+\]$/.test(name));
      expect(hasDynamicChild, sample).toBe(true);
    }
  });
  it("encodes ids so they cannot add a segment or a query", () => {
    expect(ROUTES.tpo.batch("a/b?x=1#y")).toBe("/tpo/batches/a%2Fb%3Fx%3D1%23y");
  });
});
