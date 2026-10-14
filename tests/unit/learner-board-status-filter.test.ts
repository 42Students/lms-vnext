import { describe, expect, it } from "vitest";
import {
  filterLearnerBoardTasks, learnerBoardActiveFilterCount,
  learnerBoardStatusSchema,
} from "@/modules/projects/learner-project-board-model";
import { learnerBoardTaskHref } from "@/modules/projects/learner-board-task-detail-model";

const id = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const tasks = [
  { id, title: "First task", description: null, priority: "HIGH", sprintId: id, status: "TODO" },
  { id: projectId, title: "Second task", description: null, priority: "LOW", sprintId: id, status: "BLOCKED" },
];

describe("learner Board persisted-status filter", () => {
  it("filters only the passed scoped task collection", () => {
    expect(filterLearnerBoardTasks(tasks, "", { status: "BLOCKED" }).map(task => task.title))
      .toEqual(["Second task"]);
    expect(filterLearnerBoardTasks(tasks, "", { status: "BOGUS" })).toEqual(tasks);
    expect(learnerBoardStatusSchema.safeParse("BOGUS").success).toBe(false);
  });
  it("persists status in task modal links and counts it as active", () => {
    const filters = { taskSearch: "", priority: "", status: "IN_REVIEW", sprintId: "", releaseId: "" };
    expect(learnerBoardTaskHref(projectId, filters, id)).toContain("taskStatus=IN_REVIEW");
    expect(learnerBoardActiveFilterCount({ search: "", ...filters })).toBe(1);
  });
});
