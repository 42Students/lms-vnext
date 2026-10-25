import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const superProjects = readFileSync(
  join(root, "src/app/(authenticated)/admin/projects/page.tsx"),
  "utf8",
);
const collegeProjects = readFileSync(
  join(root, "src/app/(authenticated)/college/projects/page.tsx"),
  "utf8",
);
const list = readFileSync(
  join(root, "src/components/projects/project-list.tsx"),
  "utf8",
);
const audit = readFileSync(
  join(root, "src/components/projects/project-admin-audit-page.tsx"),
  "utf8",
);

describe("W03 project admin daily-use surface parity", () => {
  it("keeps workspace search, status and pagination on both admin accounts", () => {
    for (const source of [superProjects, collegeProjects]) {
      expect(source).toContain("ProjectAdminFilters");
      expect(source).toContain("ProjectAdminPagination");
      expect(source).toContain("listProjectAdminSnapshots");
      expect(source).toContain("searchParams");
      // Admin can preserve the parsed query directly; college separates the
      // table/card view toggle before passing strict DB-only filters.
      expect(source).toMatch(/(?:const query(?:: ProjectAdminCollectionQuery)? = parsed\.data;|const \{ q, status, \.\.\.requiredQuery \} = parsed\.data;)/);
      expect(source).toContain("if (!parsed.success)");
      expect(source).toContain("Invalid project filters");
      expect(source).toContain("Clear filters");
      expect(source).toContain("query.status");
      expect(source).toContain("query={query}");
      expect(source).toContain("page={result.page}");
      expect(source).toContain("totalPages={result.totalPages}");
    }
  });

  it("surfaces the legacy mentor/member/progress scanning signals", () => {
    expect(list).toContain("mentorName");
    expect(list).toContain("memberCount");
    expect(list).toContain("progressPercent");
    expect(superProjects).toContain("project.mentorName");
    expect(collegeProjects).toContain("project.progressPercent");
  });

  it("retains the distinct project audit surface instead of a dead nav link", () => {
    expect(audit).toContain('module: "PROJECTS"');
    expect(audit).toContain("ProjectAdminNav");
    expect(audit).toContain("beforeOccurredAt");
  });
});
