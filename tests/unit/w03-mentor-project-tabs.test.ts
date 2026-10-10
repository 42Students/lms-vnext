import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const tabs = readFileSync(
  join(root, "src/components/projects/mentor-project-tabs.tsx"),
  "utf8",
);
const page = readFileSync(
  join(root, "src/app/(authenticated)/mentor/projects/[projectId]/page.tsx"),
  "utf8",
);
const workspace = readFileSync(
  join(root, "src/components/projects/project-workspace.tsx"),
  "utf8",
);

describe("W03 mentor project detail legacy tab contract", () => {
  it("keeps the exact seven legacy mentor tabs and labels", () => {
    for (const [key, label] of [
      ["overview", "Overview"],
      ["team", "People & Meetings"],
      ["sprints", "Releases and Sprints"],
      ["board", "Board"],
      ["performance", "Task Allocation"],
      ["resources", "Resources"],
      ["activity", "Activity"],
    ]) {
      expect(tabs).toContain(`key: "${key}"`);
      expect(tabs).toContain(`label: "${label}"`);
    }
  });

  it("maps legacy route keys onto normalized vNext workspace sections", () => {
    expect(page).toContain('tab === "board" || tab === "performance"');
    expect(page).toContain('? "tasks"');
    expect(page).toContain('tab === "activity"');
    expect(page).toContain('? "audit"');
    expect(page).toContain('tab === "delivery"');
    expect(page).toContain('? "delivery"');
    expect(page).toContain("activeSection={activeSection}");
  });

  it("keeps Task Allocation visibly blocked rather than fabricating assignee persistence", () => {
    expect(page).toContain('tab === "performance"');
    expect(page).toContain("does not yet persist task assignee fields");
  });

  it("shows meetings inside the mentor People & Meetings tab", () => {
    expect(workspace).toContain('mode !== "ADMIN"');
    expect(workspace).toContain('activeSection === "team"');
    expect(workspace).toContain('section === "meetings"');
  });
});
