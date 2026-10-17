import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
const workspace = readFileSync(
  new URL("../../src/components/projects/project-workspace.tsx", import.meta.url), "utf8"
);
const editor = readFileSync(
  new URL("../../src/components/projects/mentor-release-editor.tsx", import.meta.url), "utf8"
);
describe("mentor empty sprint workflow", () => {
  it("MEN-projects-meetings-R06 has truthful empty state and actionable first step", () => {
    expect(workspace).toContain('workspace.releases.length===0');
    expect(workspace).toContain("No sprints yet. Add the sprints this project should be measured against.");
    expect(workspace).toContain('href="#mentor-project-add-release"');
    expect(workspace).toContain('id="mentor-project-add-release"');
    expect(workspace).toContain("This workspace is read-only, so sprints cannot be added.");
    expect(editor).toContain("Add release");
    expect(editor).toContain('await projectMutation(url,release?"PATCH":"POST"');
  });
});
