import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = readFileSync(
  join(process.cwd(), "src/components/projects/project-workspace.tsx"),
  "utf8",
);

describe("W03 archived project read-only UI contract", () => {
  it("derives one read-only flag from persisted ARCHIVED status", () => {
    expect(workspace).toContain('workspace.project.status === "ARCHIVED"');
    expect(workspace).toContain("Archived workspace · read only");
    expect(workspace).toContain("Mutations are disabled");
  });

  it("hides team and lifecycle mutations", () => {
    expect(workspace).toContain('mode === "ADMIN" && !readOnly');
    expect(workspace).toContain('mode !== "LEARNER" && !readOnly');
    expect(workspace).toContain("!readOnly &&");
  });

  it("hides delivery, resource and meeting mutation controls while retaining history sections", () => {
    for (const control of [
      "LearnerFinalDeliveryControl",
      "CreateProjectResourceControl",
      "ProjectResourceActions",
      "RequestProjectMeetingControl",
      "ScheduleProjectMeetingControl",
      "ProjectMeetingTransitionActions",
    ]) {
      expect(workspace).toContain(control);
    }
    expect(workspace).toContain("{!readOnly ?");
    expect(workspace).toContain('show("audit")');
    expect(workspace).toContain("workspace.activity");
  });
});
