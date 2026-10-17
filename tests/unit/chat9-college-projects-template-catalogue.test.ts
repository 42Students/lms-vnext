import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { projectTemplateSectionCounts, projectTemplateCatalogueCsv } from "../../src/modules/projects/project-template-catalogue-model";
const file = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
describe("chat-9 College Projects template catalogue", () => {
  it("COL-projects-16 counts all template sections, filters on the server and exports only visible rows", () => {
    expect(projectTemplateSectionCounts({
      overview: { goal: "Hello" }, releases: [{ key: "r" }],
      sprints: [{ key: "s1" }, { key: "s2" }], tasks: [], resources: [{ key: "x" }],
    })).toEqual({ overview: 1, releases: 1, sprints: 2, tasks: 0, resources: 1 });
    expect(projectTemplateSectionCounts(null).tasks).toBe(0);
    const page = file("src/app/(authenticated)/college/projects/templates/page.tsx");
    expect(page).toContain('role="search"');
    expect(page).toContain("visible.map");
    for (const word of ["Template", "Version", "Sections", "Action", "No project templates match"])
      expect(page).toContain(word);
    const csv = projectTemplateCatalogueCsv([{
      templateId: "x", title: "=HYPERLINK(\"https://bad\")", version: 3,
      sections: { overview: 1, releases: 0, sprints: 2, tasks: 2, resources: 0 },
    }]);
    expect(csv).toContain("\uFEFF");
    expect(csv).toContain("\r\n");
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('"5"');
  });
  it("COL-projects-08 renders template tags in both list and cards without introducing a new status", () => {
    const page = file("src/app/(authenticated)/college/projects/page.tsx");
    const workspace = file("src/components/projects/project-admin-workspace-list.tsx");
    const service = file("src/modules/projects/admin-insights-service.ts");
    expect(page).toContain("templateTitle:templates.find");
    expect(service).toContain("templateId: projectInstances.templateId");
    expect(workspace).toContain("Template: ");
    expect(workspace).toContain("No template — attach one");
  });
});
