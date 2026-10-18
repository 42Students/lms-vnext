import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("PROJ-BREAK-COLLEGE-04 College Admin projects route journey", () => {
  it("PROJ-BREAK-COLLEGE-04-11 resolves an authorized college before any project list query", () => {
    const page = read("src/app/(authenticated)/college/projects/page.tsx");
    expect(page).toContain("getCurrentRequestContext()");
    expect(page).toContain("getProjectAdminCollegeId(context)");
    expect(page).toContain("if (!collegeId)");
    expect(page.indexOf("if (!collegeId)")).toBeLessThan(page.indexOf("parseCollegeProjectsQuery("));
    expect(page).toContain("listProjectAdminSnapshots(context, collegeId, query)");
  });

  it("PROJ-BREAK-COLLEGE-04-12 invalid filters recover without a SQL read or a leaked error code", () => {
    const page = read("src/app/(authenticated)/college/projects/page.tsx");
    expect(page.indexOf("if (!parsed.success)")).toBeLessThan(page.indexOf("listProjectAdminSnapshots(context, collegeId, query)"));
    expect(page).toContain("Invalid project filters");
    expect(page).toContain("Clear filters");
    expect(page).toContain("Select a college to continue.");
    expect(page).not.toContain("PROJECT_ACCESS_DENIED");
  });

  it("PROJ-BREAK-COLLEGE-04-13 optional template label lookup cannot hide persisted projects", () => {
    const page = read("src/app/(authenticated)/college/projects/page.tsx");
    expect(page).toContain("listAssignedProjectTemplates(context, collegeId)");
    expect(page).toContain(".catch(() => ({ ok: false as const }))");
    expect(page).toContain("Template names are unavailable right now.");
    expect(page).toContain("<ProjectAdminWorkspaceList");
    expect(page).toContain("<ProjectAdminPagination");
    expect(page).toContain("Archived workspaces");
  });

  it("PROJ-BREAK-COLLEGE-04-14 project section detail authorizes the persisted college before returning a workspace", () => {
    const detail = read("src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx");
    const shared = read("src/components/projects/admin-project-section-page.tsx");
    expect(detail).toContain("<AdminProjectSectionPage");
    expect(detail).toContain('basePath="/college/projects"');
    expect(shared).toContain("requireProjectManageAccess(");
    expect(shared).toContain("getProjectWorkspaceView(");
    expect(shared.indexOf("await requireProjectManageAccess(")).toBeLessThan(shared.indexOf("await getProjectWorkspaceView("));
    expect(shared).toContain('mode="ADMIN"');
  });
});
