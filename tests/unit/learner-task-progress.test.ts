import { describe, expect, it } from "vitest";
import {
  learnerTaskProgressInputSchema, learnerTaskTransitionAllowed, learnerTaskProgressSuccess,
} from "@/modules/projects/learner-task-progress-model";

describe("LEARNER-projects-25 own task status, blocker and order contracts", () => {
  it("only permits learner progress before review/completion", () => {
    expect(learnerTaskTransitionAllowed("TODO", "IN_PROGRESS")).toBe(true);
    expect(learnerTaskTransitionAllowed("IN_PROGRESS", "BLOCKED", "Need review")).toBe(true);
    expect(learnerTaskTransitionAllowed("TODO", "BLOCKED", "")).toBe(false);
    expect(learnerTaskTransitionAllowed("DONE", "TODO")).toBe(false);
    expect(learnerTaskTransitionAllowed("IN_REVIEW", "TODO")).toBe(false);
    expect(learnerTaskTransitionAllowed("TODO", "DONE")).toBe(false);
  });
  it("validates fresh timestamps, notes and strict move requests", () => {
    const expectedUpdatedAt = "2026-10-16T10:00:00.000Z";
    const action = { action: "STATUS", status: "BLOCKED", blockerNote: "Waiting on API", expectedUpdatedAt };
    expect(learnerTaskProgressInputSchema.safeParse(action).success).toBe(true);
    expect(learnerTaskProgressInputSchema.safeParse({ ...action, blockerNote: "" }).success).toBe(false);
    expect(learnerTaskProgressInputSchema.safeParse({ ...action, status: "DONE" }).success).toBe(false);
    expect(learnerTaskProgressInputSchema.safeParse({ action: "MOVE_UP", expectedUpdatedAt }).success).toBe(true);
    expect(learnerTaskProgressInputSchema.safeParse({ action: "MOVE_UP", expectedUpdatedAt, taskId: "other" }).success).toBe(false);
  });
  it("retains exact legacy success messages", () => {
    expect(learnerTaskProgressSuccess("STATUS", "IN_PROGRESS")).toBe("Task moved to In Progress.");
    expect(learnerTaskProgressSuccess("STATUS", "BLOCKED")).toBe("Blocker reported.");
    expect(learnerTaskProgressSuccess("MOVE_UP")).toBe("Task update saved.");
  });
});
