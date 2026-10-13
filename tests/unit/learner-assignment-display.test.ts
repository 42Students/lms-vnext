import { describe, expect, it } from "vitest";
import { assignmentOverviewState } from "@/modules/courses/learner-assignment-display";

const now = Date.parse("2026-10-13T10:00:00Z");
const input = {
  dueAt: null as string | null, submittedAt: null as string | null,
  gradePublished: false, pointsAwarded: null as number | null,
  maxPoints: 100,
};

describe("learner aggregate assignment display", () => {
  it("keeps overdue assignments actionable for late submission", () => {
    const state = assignmentOverviewState({ ...input, dueAt: "2026-10-12T10:00:00Z" }, now);
    expect(state).toMatchObject({ label: "Overdue · late submission allowed", action: "Submit" });
  });
  it("shows due soon before 48 hours, otherwise not submitted", () => {
    expect(assignmentOverviewState({ ...input, dueAt: "2026-10-14T10:00:00Z" }, now).label).toBe("Due soon");
    expect(assignmentOverviewState({ ...input, dueAt: "2026-10-15T10:00:00Z" }, now).label).toBe("Not submitted");
  });
  it("keeps unpublished grade details hidden and notes submitted late", () => {
    const state = assignmentOverviewState({
      ...input, dueAt: "2026-10-12T10:00:00Z",
      submittedAt: "2026-10-13T11:00:00Z", pointsAwarded: 98,
    }, now);
    expect(state).toMatchObject({ label: "Submitted late · awaiting grade", action: "View" });
    expect(state.label).not.toContain("98");
  });
  it("displays points only after explicit grade publication", () => {
    expect(assignmentOverviewState({ ...input, gradePublished: true, pointsAwarded: 70 }, now))
      .toMatchObject({ label: "Graded · 70/100", action: "View" });
  });
});
