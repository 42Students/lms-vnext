import { derivedProjectProgress, projectProgress } from "@/components/admin/projects/adminProjectUtils";

describe("one workspace progress formula", () => {
  test("tasks and sprints count together, like the student/mentor Overview donut", () => {
    const ws = { progress: 90, readiness: { totalTasks: 8, completedTasks: 4, totalSprints: 2, completedSprints: 1 } };
    expect(derivedProjectProgress(ws)).toBe(50);
    // The hand-set 90 must not win once there is real work on the board.
    expect(projectProgress(ws)).toBe(50);
  });

  test("the hand-set figure only applies before any tasks or sprints exist", () => {
    const ws = { progress: 30, readiness: { totalTasks: 0, totalSprints: 0 } };
    expect(derivedProjectProgress(ws)).toBeNull();
    expect(projectProgress(ws)).toBe(30);
  });

  test("never outside 0-100", () => {
    expect(projectProgress({ progress: 140 })).toBe(100);
    expect(projectProgress({ readiness: { totalTasks: 2, completedTasks: 5 } })).toBe(100);
  });
});
