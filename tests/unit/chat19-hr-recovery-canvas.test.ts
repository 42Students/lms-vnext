import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const inventory = readFileSync("docs/orchestrator/ui-ux/pages-hr.md", "utf8");
const pages = [...inventory.matchAll(/\((src\/app\/\(authenticated\)\/hr\/[^\n)]+)\)/g)]
  .map(match => match[1]);

describe("NORTH-STAR-CHAT19: recruiter recovery screens inherit the legacy canvas", () => {
  it("keeps route error fallbacks free of a second full-surface frame", () => {
    expect(pages).toHaveLength(22);
    for (const page of pages) {
      const path = page.replace(/page\.tsx$/, "error.tsx");
      if (!existsSync(path)) continue;
      const code = readFileSync(path, "utf8");
      expect(code, path).not.toMatch(/rounded-(?:md|lg|xl|2xl)\b/);
      expect(code, path).not.toContain("bg-surface px-6 py-10");
      expect(code, path).not.toContain('<main role="alert"');
      if (code.includes("<GracefulErrorBoundary")) {
        expect(code, path).toContain("insideShell");
      }
    }
  });

  it("keeps page loading placeholders within one shared main and on legacy radii", () => {
    for (const page of pages) {
      const path = page.replace(/page\.tsx$/, "loading.tsx");
      if (!existsSync(path)) continue;
      const code = readFileSync(path, "utf8");
      expect(code, path).not.toMatch(/\brounded-(?:md|lg|xl|2xl)\b/);
      expect(code, path).not.toContain("rounded-[9px]");
      expect(code, path).not.toContain("<main aria-busy");
    }
  });

  it("retains navigation actions without duplicate 9px literal controls", () => {
    for (const path of [
      "src/app/(authenticated)/hr/not-found.tsx",
      "src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx",
    ]) {
      const code = readFileSync(path, "utf8");
      expect(code, path).not.toContain("rounded-[9px]");
      expect(code, path).not.toMatch(/focus-visible:outline-primary\b/);
    }
  });
});
