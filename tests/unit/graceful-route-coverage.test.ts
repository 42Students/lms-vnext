import { describe, expect, it } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";

function routeSegments(root: string): string[] {
  const output: string[] = [];
  function visit(dir: string) {
    const items = readdirSync(dir, { withFileTypes: true });
    if (items.some((item) => item.isFile() && (item.name === "page.tsx" || item.name === "layout.tsx"))) {
      output.push(dir);
    }
    for (const item of items) if (item.isDirectory()) visit(path.join(dir, item.name));
  }
  visit(root);
  return output;
}

describe("route error and loading coverage", () => {
  it("GR-19 every page/layout segment has a bounded loading fallback", () => {
    const missing = routeSegments("src/app").filter((dir) => !existsSync(path.join(dir, "loading.tsx")));
    expect(missing, `Missing loading boundaries: ${missing.join(", ")}`).toEqual([]);
  });
  it("GR-20 every page/layout segment has a customer-safe retry boundary", () => {
    const missing = routeSegments("src/app").filter((dir) => !existsSync(path.join(dir, "error.tsx")));
    expect(missing, `Missing error boundaries: ${missing.join(", ")}`).toEqual([]);
  });
});
