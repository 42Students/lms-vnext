import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/modules/projects/lifecycle-service.ts",
  "utf8",
);

describe("W03 project lifecycle concurrency contract", () => {
  it("serializes lifecycle mutations on persisted project/sprint/task rows", () => {
    expect(source.match(/\.for\("update"\)/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(source).toContain('projectAllowsExecution(project.status)');
    expect(source).toContain('lockedTask.status !== task.status');
    expect(source).toContain('eq(projectTasks.status, task.status)');
  });

  it("rechecks sprint and release prerequisites inside their transactions", () => {
    const completeStart = source.indexOf("export async function completeProjectSprint");
    const taskCheck = source.indexOf("PROJECT_SPRINT_HAS_OPEN_TASKS", completeStart);
    const transaction = source.indexOf("db.transaction", completeStart);
    expect(transaction).toBeGreaterThan(completeStart);
    expect(taskCheck).toBeGreaterThan(transaction);

    const shipStart = source.indexOf("export async function shipProjectRelease");
    const releaseTransaction = source.indexOf("db.transaction", shipStart);
    const openSprintCheck = source.indexOf("PROJECT_RELEASE_HAS_OPEN_SPRINTS", shipStart);
    expect(releaseTransaction).toBeGreaterThan(shipStart);
    expect(openSprintCheck).toBeGreaterThan(releaseTransaction);
  });

  it("never reopens archived/completed projects as a lifecycle side effect", () => {
    expect(source).toContain('status !== "ARCHIVED" && status !== "COMPLETED"');
    expect(source).toContain('ne(projectInstances.status, "ARCHIVED")');
    expect(source).toContain('ne(projectInstances.status, "COMPLETED")');
  });
});
