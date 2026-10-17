import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const audit = readFileSync(
  join(root, "src/components/projects/project-admin-audit-page.tsx"),
  "utf8",
);
const nav = readFileSync(
  join(root, "src/components/projects/project-admin-nav.tsx"),
  "utf8",
);
const superRoute = readFileSync(
  join(root, "src/app/(authenticated)/admin/projects/audit/page.tsx"),
  "utf8",
);
const collegeRoute = readFileSync(
  join(root, "src/app/(authenticated)/college/projects/audit/page.tsx"),
  "utf8",
);

describe("W03 project admin audit parity contract", () => {
  it("keeps both legacy account audit routes behind the Projects nav", () => {
    expect(nav).toContain('["/audit", "Audit"]');
    expect(superRoute).toContain('basePath="/admin/projects"');
    expect(collegeRoute).toContain('basePath="/college/projects"');
  });

  it("reads only PROJECTS activity and preserves legacy-style audit filters", () => {
    expect(audit).toContain('module: "PROJECTS"');
    expect(audit).toContain("searchParams.action");
    expect(audit).toContain("searchParams.status");
    expect(audit).toContain("searchParams.subjectType");
    expect(audit).toContain("searchParams.from");
    expect(audit).toContain("searchParams.to");
  });

  it("requires an explicit college scope for the super-admin audit surface", () => {
    // The page route now enforces college selection before the shared audit
    // component is even rendered. That is stronger than an inner UI guard.
    expect(superRoute).toContain("getProjectAdminCollegeId(context)");
    expect(superRoute).toContain("if (!collegeId)");
    expect(superRoute).toContain("Select a college scope");
    expect(audit).toContain("isSuperAdmin(context)");
  });

  it("preserves cursor filters when loading older activity", () => {
    expect(audit).toContain('"beforeOccurredAt"');
    expect(audit).toContain('"beforeId"');
    // Compare ignoring whitespace so formatter line-wrapping cannot break it.
    const flat = audit.replace(/\s+/g, "");
    expect(flat).toContain('nextParams.set("action",eventType)');
    expect(flat).toContain('nextParams.set("subjectType",subjectType');
  });
});
