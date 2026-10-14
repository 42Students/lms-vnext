import { describe, expect, it } from "vitest";
import {
  collegeStudyGroupCreateSchema,
  collegeStudyGroupChangeSchema,
  studyGroupNextStatus,
  studyGroupConflictMessage,
} from "@/modules/groups/college-group-management-model";

describe("College Admin Study Group mutation contracts", () => {
  it("strictly validates name, optional capacity and never accepts client college", () => {
    expect(collegeStudyGroupCreateSchema.parse({
      name: "  Robotics  ", description: "", capacity: null,
    })).toEqual({ name: "Robotics", description: "", capacity: null });
    for (const bad of [
      { name: "", description: "", capacity: null },
      { name: "Test", description: "", capacity: 0 },
      { name: "Test", description: "", capacity: 1.5 },
      { name: "Test", description: "", capacity: null, collegeId: "foreign" },
      { name: "A".repeat(151), description: "", capacity: 10 },
    ]) {
      expect(collegeStudyGroupCreateSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("requires explicit optimistic version and narrows mutation discriminant", () => {
    expect(collegeStudyGroupChangeSchema.safeParse({
      action: "EDIT", expectedVersion: 1, name: "Robotics",
      description: "group", capacity: 10,
    }).success).toBe(true);
    expect(collegeStudyGroupChangeSchema.safeParse({
      action: "STATUS", transition: "ARCHIVE", expectedVersion: 3,
    }).success).toBe(true);
    for (const bad of [
      { action: "STATUS", transition: "DELETE", expectedVersion: 1 },
      { action: "STATUS", transition: "CLOSE", expectedVersion: -1 },
      { action: "STATUS", transition: "CLOSE", expectedVersion: 1, collegeId: "other" },
      { action: "EDIT", expectedVersion: 0, name: "Group", capacity: null },
    ]) {
      expect(collegeStudyGroupChangeSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("prevents archive when any active/open member remains", () => {
    expect(studyGroupNextStatus("DRAFT", "ACTIVATE", 0, 0)).toBe("ACTIVE");
    expect(studyGroupNextStatus("ACTIVE", "CLOSE", 3, 3)).toBe("CLOSED");
    expect(studyGroupNextStatus("CLOSED", "ARCHIVE", 0, 1)).toBeNull();
    expect(studyGroupNextStatus("DRAFT", "ARCHIVE", 1, 0)).toBeNull();
    expect(studyGroupNextStatus("CLOSED", "ARCHIVE", 0, 0)).toBe("ARCHIVED");
    expect(studyGroupNextStatus("ARCHIVED", "ACTIVATE", 0, 0)).toBeNull();
    expect(studyGroupConflictMessage("GROUP_STALE")).toContain("Refresh");
  });
});
