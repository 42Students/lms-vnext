import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const root = "src/app/(authenticated)/college";

describe("chat-4 College UX canonical redirects and shared-kit coverage", () => {
  it("COL-ux-redirect-01 People entry lands on read-only contacts rather than privileged account management", () => {
    const source = read(root + "/people/page.tsx");
    expect(source).toContain('import CollegeContactsPage from "../contacts/page"');
    expect(source).toContain("<CollegeContactsPage");
    expect(source).not.toContain('redirect("/college/people/manage")');
    const destination = read(root + "/contacts/page.tsx");
    expect(destination).toContain("getCurrentRequestContext()");
  });

  it("COL-ux-redirect-02 legacy workspace list resolves to one canonical Projects list", () => {
    const source = read(root + "/projects/workspaces/page.tsx");
    expect(source).toContain('redirect("/college/projects"+');
    const destination = read(root + "/projects/page.tsx");
    expect(destination).toContain("getCurrentRequestContext()");
  });

  it("COL-ux-redirect-03 legacy workspace identifiers are URL-encoded to avoid forged segments", () => {
    const source = read(root + "/projects/workspaces/[workspaceId]/page.tsx");
    expect(source).toContain("encodeURIComponent(workspaceId)");
    expect(source).toContain('const next="/college/projects/"+encodeURIComponent(workspaceId)');
    expect(source).not.toContain("workspaceId +");
  });

  it("COL-ux-redirect-04 legacy section bookmarks encode both tenant project and section", () => {
    const source = read(root + "/projects/workspaces/[workspaceId]/[section]/page.tsx");
    expect(source).toContain("encodeURIComponent(workspaceId)");
    expect(source).toContain("encodeURIComponent(section)");
    expect(source).toContain("redirect(");
    expect(source).not.toContain("decodeURIComponent(");
  });

  it("COL-ux-redirect-05 direct Projects details resolve to guarded canonical summary routes", () => {
    const source = read(root + "/projects/[projectId]/page.tsx");
    expect(source).toContain("encodeURIComponent(projectId)");
    expect(source).toContain('"/summary"');
    const destination = read(root + "/projects/[projectId]/[section]/page.tsx");
    expect(destination).toContain("<AdminProjectSectionPage");
    const guarded = read("src/components/projects/admin-project-section-page.tsx");
    expect(guarded).toContain("getCurrentRequestContext()");
    expect(guarded).toContain("requireProjectManageAccess");
  });

  it("COL-ux-scroll-01 wide people lists and imports have a labelled scroll cue through DataTable", () => {
    const role = read("src/components/college/college-role-directory-workspace.tsx");
    expect(role).toContain("<DataTable");
    const table = read("src/components/ui/data-table.tsx");
    expect(table).toContain('<ScrollCue axis="x"');
    for (const component of [
      "college-faculty-csv-import.tsx",
      "college-student-csv-import.tsx",
      "college-student-import-history.tsx",
      "college-department-insights.tsx",
    ]) expect(read("src/components/college/" + component)).toContain("<DataTable");
  });
});
