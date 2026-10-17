import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = readFileSync(
  join(process.cwd(), "src/components/projects/project-workspace.tsx"),
  "utf8",
);
const resourceList = readFileSync(
  join(process.cwd(), "src/components/projects/project-resource-list.tsx"),
  "utf8",
);
const mentorPage = readFileSync(
  join(process.cwd(), "src/app/(authenticated)/mentor/projects/[projectId]/page.tsx"),
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
      "ProjectResourceList",
      "RequestProjectMeetingControl",
      "ScheduleProjectMeetingControl",
      "ProjectMeetingTransitionActions",
    ]) {
      expect(workspace).toContain(control);
    }
    // Actions were moved into ProjectResourceList: assert the real boundary.
    expect(resourceList).toContain("ProjectResourceActions");
    expect(resourceList).toContain("!readOnly");
    expect(workspace).toContain('mode={mode} readOnly={readOnly}');
    expect(workspace).toContain("{!readOnly ?");
    expect(workspace).toContain('show("audit")');
    expect(workspace).toContain("workspace.activity");
  });

  it("keeps archived or completed mentor task tabs read only, not only the workspace body", () => {
    expect(mentorPage).toContain('readOnly={access.access==="OBSERVER"||workspace.project.status==="ARCHIVED"||workspace.project.status==="COMPLETED"}');
    expect(mentorPage).toContain('workspace.project.status==="COMPLETED"||workspace.project.status==="ARCHIVED"');
  });
});
