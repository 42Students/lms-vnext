import { describe, expect, it } from "vitest";
import { updateProjectTaskStatusInputSchema } from "@/modules/projects/validation";
import { allowedMentorTaskTransition } from "@/modules/projects/mentor-task-transition-model";
import { readFileSync } from "node:fs";

const lifecycle = readFileSync(new URL("../../src/modules/projects/lifecycle-service.ts", import.meta.url), "utf8");

describe("PR-S2-02: task review owns DONE and IN_REVIEW", () => {
  const token = "2026-10-15T10:00:00.000Z";
  it("only permits ordinary states with an optimistic timestamp", () => {
    for (const status of ["TODO", "IN_PROGRESS", "BLOCKED"]) {
      expect(updateProjectTaskStatusInputSchema.safeParse({ status, expectedUpdatedAt: token }).success).toBe(true);
    }
    for (const status of ["DONE", "IN_REVIEW"]) {
      expect(updateProjectTaskStatusInputSchema.safeParse({ status, expectedUpdatedAt: token }).success).toBe(false);
    }
    expect(updateProjectTaskStatusInputSchema.safeParse({ status: "TODO" }).success).toBe(false);
  });
  it("refuses to revert reviewed tasks and no-op changes", () => {
    expect(allowedMentorTaskTransition("DONE", "TODO")).toBe(false);
    expect(allowedMentorTaskTransition("IN_REVIEW", "TODO")).toBe(false);
    expect(allowedMentorTaskTransition("BLOCKED", "BLOCKED")).toBe(false);
    expect(allowedMentorTaskTransition("BLOCKED", "IN_PROGRESS")).toBe(true);
  });
  it("locks the task in its transaction and records status activity", () => {
    const fn = lifecycle.split("export async function updateProjectTaskStatus(")[1]?.split("export async function unshipProjectRelease(")[0] ?? "";
    expect(fn).toContain('recordActivityEventInTransaction(tx, context');
    expect(fn).toContain("date_trunc('milliseconds', ${projectTasks.updatedAt})");
    expect(fn).toContain('.for("update").limit(1)');
  });
});
