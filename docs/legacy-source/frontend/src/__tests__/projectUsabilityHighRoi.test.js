import { deriveProjectNextDue } from "@/api/Services/projectService";

describe("Projects high-ROI usability invariants", () => {
  test("next due ignores completed work and picks the nearest real unfinished task/sprint date", () => {
    const next = deriveProjectNextDue({
      resolvedSprints: [
        { sprintKey: "done-sprint", sprintState: "COMPLETED", dueDate: "2026-10-01" },
        { sprintKey: "active-sprint", sprintState: "ACTIVE", dueDate: "2026-10-08", title: "Sprint 2" },
      ],
      resolvedTasks: [
        { taskKey: "done-task", status: "Completed", dueDate: "2026-09-30" },
        { taskKey: "todo-task", status: "To Do", dueDate: "2026-10-05", title: "Authentication API" },
      ],
    });
    expect(next).toMatchObject({ type: "TASK", entityId: "todo-task", title: "Authentication API", label: "05 Oct 2026" });
  });

  test("supports Jackson array dates and returns null when no unfinished work has a real date", () => {
    expect(deriveProjectNextDue({
      resolvedTasks: [{ taskKey: "array-date", status: "In Progress", dueDate: [2026, 11, 7] }],
      resolvedSprints: [],
    })).toMatchObject({ type: "TASK", entityId: "array-date", label: "07 Nov 2026" });

    expect(deriveProjectNextDue({
      resolvedTasks: [{ status: "Completed", dueDate: "2026-10-02" }, { status: "To Do", dueLabel: "TBD" }],
      resolvedSprints: [],
    })).toBeNull();
  });
});
