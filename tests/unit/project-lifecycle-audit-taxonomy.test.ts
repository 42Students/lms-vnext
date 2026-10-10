import { describe, expect, it } from "vitest";
import {
  ACTIVITY_EVENT_TYPES,
  ACTIVITY_IMPORTANCE,
  defaultActivityImportance,
} from "@/modules/activity/taxonomy";

describe("W06 project lifecycle event taxonomy", () => {
  it("defines distinct stable lifecycle identifiers for W03's persisted changes", () => {
    const types = [
      ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_ARCHIVED,
      ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_RESTORED,
      ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_DELETED,
      ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_REASSIGNED,
      ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN,
    ];
    expect(types).toEqual([
      "projects.project.archived",
      "projects.project.restored",
      "projects.project.deleted",
      "projects.mentor.reassigned",
      "projects.readiness.overridden",
    ]);
    expect(new Set(types).size).toBe(types.length);
    expect(types.every((type) => type.startsWith("projects."))).toBe(true);
  });

  it("highlights destructive and readiness override operations for audit triage", () => {
    for (const key of [
      "PROJECTS_PROJECT_ARCHIVED",
      "PROJECTS_PROJECT_DELETED",
      "PROJECTS_READINESS_OVERRIDDEN",
    ] as const) {
      expect(defaultActivityImportance(ACTIVITY_EVENT_TYPES[key])).toBe("HIGH");
    }
    expect(defaultActivityImportance(
      ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_RESTORED,
    )).toBe("NORMAL");
    expect(defaultActivityImportance(
      ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_REASSIGNED,
    )).toBe("NORMAL");
  });

  it("does not remove any previously recognized activity importance", () => {
    expect(ACTIVITY_IMPORTANCE).toEqual(["LOW","NORMAL","HIGH","CRITICAL"]);
    expect(defaultActivityImportance(ACTIVITY_EVENT_TYPES.PROJECTS_TASK_SUBMITTED))
      .toBe("NORMAL");
  });
});
