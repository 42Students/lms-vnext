import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const controls = readFileSync(
  join(root, "src/components/projects/project-template-controls.tsx"),
  "utf8",
);
const listPage = readFileSync(
  join(root, "src/app/(authenticated)/admin/projects/templates/page.tsx"),
  "utf8",
);
const detailPage = readFileSync(
  join(root, "src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx"),
  "utf8",
);

describe("W03 super-admin project template UI contract", () => {
  it("can create a valid release-sprint-task baseline", () => {
    expect(listPage).toContain("CreateProjectTemplateControl");
    expect(controls).toContain('"/api/projects/templates"');
    expect(controls).toContain('key: "release-1"');
    expect(controls).toContain('releaseKey: "release-1"');
    expect(controls).toContain('sprintKey: "sprint-1"');
  });

  it("exposes publish and archive through the existing template APIs", () => {
    expect(detailPage).toContain("ProjectTemplateActions");
    expect(controls).toContain('"/publish"');
    expect(controls).toContain('"Archive template"');
    expect(controls).toContain('"DELETE"');
  });

  it("assigns or revokes only the currently selected college", () => {
    expect(detailPage).toContain("context.adminScope?.collegeId");
    expect(detailPage).toContain("assignedToSelectedCollege");
    expect(controls).toContain('"Assign selected college"');
    expect(controls).toContain('"Revoke selected college"');
    expect(controls).toContain("collegeId:");
  });
});
