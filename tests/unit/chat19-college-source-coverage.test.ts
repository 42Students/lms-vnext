import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

/** Audit the owner-maintained route list rather than an easy-to-forget handpicked subset. */
const manifest = readFileSync("docs/orchestrator/ui-ux/pages-college.md", "utf8");
const routes = manifest.split("\n").flatMap(line => {
  const beginning = line.indexOf("(src/app/");
  const quote = line.indexOf("`/college");
  if (beginning < 0 || quote < 0) return [];
  const end = line.indexOf("`", quote + 1);
  return [{
    route: line.slice(quote + 1, end),
    path: line.slice(beginning + 1, line.lastIndexOf(")")),
  }];
});

describe("chat-19 all /college route entry point source coverage", () => {
  it("UX-college-source-coverage-00 validates all 85 owner-enumerated routes with unique paths", () => {
    expect(routes).toHaveLength(85);
    expect(new Set(routes.map(item => item.route)).size).toBe(85);
    expect(new Set(routes.map(item => item.path)).size).toBe(85);
    for (const { path } of routes) expect(existsSync(path)).toBe(true);
  });

  it.each(routes)("UX-college-source-coverage-01 route $route avoids banned native interactions, raw tables and low-contrast link utility", ({ path }) => {
    const source = readFileSync(path, "utf8");
    // These checks are deliberately limited to page-level source. The nested
    // client component audit is a separate release gate.
    expect(source).not.toMatch(/window[.](alert|confirm|prompt)[(]/);
    expect(source).not.toMatch(/<table([ >]|$)/);
    expect(source).not.toContain("text-primary-text");
    expect(source).toMatch(/export /);
  });

  it("UX-college-source-coverage-02 verifies links into Projects are always scoped to /college", () => {
    const files = [
      "src/app/(authenticated)/college/projects/page.tsx",
      "src/app/(authenticated)/college/projects/templates/page.tsx",
      "src/app/(authenticated)/college/projects/workspaces/new/page.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("/college/projects");
      expect(source).not.toContain('href="//');
    }
    const projects = readFileSync(files[0], "utf8");
    expect(projects).toContain('getProjectAdminCollegeId(context)');
    expect(projects).toContain('if (!collegeId)');
    expect(projects).toContain('listProjectAdminSnapshots(context, collegeId');
    expect(projects).toContain('listAssignedProjectTemplates(context, collegeId');
  });
});
