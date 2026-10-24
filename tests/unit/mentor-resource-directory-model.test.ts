import { describe, expect, it } from "vitest";
import {
  mentorResourceEarlierScope,
  mentorResourceLinkedScopeLabels,
  mentorResourceMatchesType,
} from "@/modules/projects/mentor-resource-directory-model";

describe("Mentor resources: historic folds and scope labels", () => {
  const rows = [
    { id: "pinned-old", sprintId: "done", pinned: true },
    { id: "old", sprintId: "done", pinned: false },
    { id: "active", sprintId: "current", pinned: false },
    { id: "whole", sprintId: null, pinned: false },
    { id: "imported", sprintId: "foreign", pinned: false },
  ];
  const completed = new Set(["done"]);

  it("keeps pinned completed-sprint references on screen while folding old unpinned rows", () => {
    const result = mentorResourceEarlierScope(rows, completed, true);
    expect(result.earlierCount).toBe(1);
    expect(result.visibleRows.map(row => row.id))
      .toEqual(["pinned-old", "active", "whole", "imported"]);
    expect(rows.map(row => row.id))
      .toEqual(["pinned-old", "old", "active", "whole", "imported"]);
  });

  it("expands all 31+ completed resources without losing their original order", () => {
    const many = Array.from({ length: 31 }, (_, n) => ({
      id: "old-" + n, sprintId: "done", pinned: false,
    }));
    const result = mentorResourceEarlierScope(many, completed, true);
    expect(result.earlierCount).toBe(31);
    expect(result.visibleRows).toEqual([]);
    expect(mentorResourceEarlierScope(many, completed, false).visibleRows)
      .toEqual(many);
  });

  it("does not classify unknown or unscoped resources as old", () => {
    const result = mentorResourceEarlierScope(rows, completed, true);
    expect(result.visibleRows.some(row => row.id === "imported")).toBe(true);
    expect(result.visibleRows.some(row => row.id === "whole")).toBe(true);
  });

  it("uses actual authorized sprint/task names, not generic linked badges", () => {
    expect(mentorResourceLinkedScopeLabels(
      { sprintId: "current", taskId: "task-1" },
      [{ id: "current", label: "Sprint 13" }],
      [{ id: "task-1", label: "Implement review" }],
    )).toEqual(["Sprint: Sprint 13", "Task: Implement review"]);
  });

  it("does not invent a scope name when references are missing", () => {
    expect(mentorResourceLinkedScopeLabels(
      { sprintId: "foreign", taskId: "absent" },
      [{ id: "current", label: "Sprint 13" }],
      [{ id: "task-1", label: "Implement review" }],
    )).toEqual(["Linked sprint unavailable", "Linked task unavailable"]);
    expect(mentorResourceLinkedScopeLabels({}, [], [])).toEqual([]);
  });

  it("does not misclassify attached files as links just because they have a URL", () => {
    expect(mentorResourceMatchesType("LINK", "FILE", true)).toBe(false);
    expect(mentorResourceMatchesType("FILE", "FILE", true)).toBe(true);
    expect(mentorResourceMatchesType("LINK", null, true)).toBe(true);
    expect(mentorResourceMatchesType("OTHER", null, false)).toBe(true);
    expect(mentorResourceMatchesType("LINK", "LINK", false)).toBe(true);
  });
});
