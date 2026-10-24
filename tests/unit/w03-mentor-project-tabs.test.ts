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
      ["team", "Team & meetings"],
      ["sprints", "Sprints & releases"],
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
    expect(page).toContain('selectedTab === "board" || selectedTab === "performance"');
    expect(page).toContain('? "tasks"');
    expect(page).toContain('selectedTab === "activity"');
    expect(page).toContain('? "audit"');
    expect(page).toContain('selectedTab === "delivery"');
    expect(page).toContain('? "delivery"');
    expect(page).toContain("activeSection={activeSection}");
  });

  it("serves real persisted task assignees without the pre-migration placeholder", () => {
    expect(page).toContain('selectedTab==="performance"');
    expect(page).not.toContain("does not yet persist task assignee fields");
    expect(workspace).toContain("<ProjectTaskAssigneeControl");
    expect(workspace).toContain("assigneeMembershipId={task.assigneeMembershipId}");
  });

  it("shows meetings inside the mentor People & Meetings tab", () => {
    expect(workspace).toContain('mode !== "ADMIN"');
    expect(workspace).toContain('activeSection === "team"');
    expect(workspace).toContain('section === "meetings"');
  });
});
