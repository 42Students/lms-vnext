import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("learner project tab behavior", () => {
  it("maps legacy tab names onto the normalized workspace sections", () => {
    const page = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/learn/projects/[projectId]/page.tsx",
      ),
      "utf8",
    );
    const workspace = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/projects/project-workspace.tsx",
      ),
      "utf8",
    );

    expect(page).toContain("searchParams");
    expect(page).toContain('tab === "board"');
    expect(page).toContain('? "tasks"');
    expect(page).toContain('tab === "activity"');
    expect(page).toContain('? "audit"');
    expect(page).toContain("activeSection={activeSection}");

    for (const section of [
      "team",
      "sprints",
      "tasks",
      "resources",
      "audit",
    ]) {
      expect(workspace).toContain(`show("${section}")`);
    }

    expect(workspace).toContain(
      'activeSection === "team"',
    );
    expect(workspace).toContain(
      'section === "meetings"',
    );
  });
});
