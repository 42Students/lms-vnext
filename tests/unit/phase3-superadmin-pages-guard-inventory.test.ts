import { describe, expect, it } from "vitest";
import { GUARD, oneHopSources, pageFiles, read, rel } from "./phase3-scan-helpers";

/**
 * Pages under /admin sit behind the Super Admin layout, but a page must not rely
 * on the layout alone: every page either checks the request context itself,
 * redirects without reading data, or delegates to a module that does. The
 * delegating pages are frozen so a new data-reading page that skips the check
 * is a deliberate, reviewed decision.
 */
const PAGES = pageFiles("src/app/(authenticated)/admin").map((p) => ({ file: rel(p), abs: p, src: read(p) }));

const readsData = (src: string) => /from\s+["']@\/db|getDb\(\)|drizzle-orm/.test(src);
const hasContext = (src: string) => /getCurrentRequestContext/.test(src);
const rendersComponent = (src: string) => /<[A-Z][A-Za-z0-9]*[\s/>]/.test(src);
const redirectOnly = (src: string) => /redirect\(/.test(src) && !readsData(src) && !rendersComponent(src);

/** Pages that neither call the request context nor redirect-only; their delegate holds the check. */
const DELEGATING = new Set([
  "src/app/(authenticated)/admin/live-classes/page.tsx",
  "src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx",
  "src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx",
  "src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx",
  "src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx",
  "src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx",
  "src/app/(authenticated)/admin/recruiters/page.tsx",
  "src/app/(authenticated)/admin/resources/page.tsx",
  "src/app/(authenticated)/admin/videos/page.tsx",
]);

describe("Phase 3: /admin pages do not rely on the layout alone", () => {
  it("scans the admin page tree", () => {
    expect(PAGES.length).toBeGreaterThan(100);
  });

  it("every admin page checks the context, redirects without data, or is a reviewed delegating page", () => {
    const stray = PAGES.filter(
      ({ file, src }) => !hasContext(src) && !redirectOnly(src) && !DELEGATING.has(file),
    ).map((p) => p.file);
    expect(stray, `pages with no guard path: ${stray.join(", ")}`).toEqual([]);
  });

  it("the delegating list contains only pages that still delegate (no stale entries)", () => {
    for (const file of DELEGATING) {
      const page = PAGES.find((p) => p.file === file);
      expect(page, `${file} no longer exists`).toBeDefined();
      expect(
        hasContext(page!.src) || redirectOnly(page!.src),
        `${file} now guards itself; remove it from DELEGATING`,
      ).toBe(false);
    }
  });

  it("every delegating page imports at least one module that checks the context", () => {
    for (const file of DELEGATING) {
      const page = PAGES.find((p) => p.file === file)!;
      const sources = oneHopSources(page.abs).slice(1);
      const guarded = sources.some((s) => hasContext(s) || GUARD.test(s));
      // Pages that only forward to another page (../hr/page) are checked through that import.
      expect(guarded, `${file} delegates to modules with no request-context or guard`).toBe(true);
    }
  });

  it("redirect-only pages encode dynamic segments before putting them in a path", () => {
    for (const { file, src } of PAGES) {
      if (!/\{\s*(?:workspaceId|projectId|templateId)\s*\}/.test(src) || !redirectOnly(src)) continue;
      for (const m of src.matchAll(/redirect\(\s*["'`]([^"'`]*)["'`]\s*\+\s*([^)]+)\)/g)) {
        expect(m[2], `${file} concatenates an unencoded value into a redirect`).toMatch(/encodeURIComponent\(/);
      }
    }
  });
});
