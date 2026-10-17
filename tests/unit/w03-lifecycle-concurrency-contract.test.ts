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
    expect(source).toContain("allowedMentorTaskTransition(lockedTask.status, input.status)");
    expect(source).toContain("eq(projectTasks.status, lockedTask.status)");
    expect(source).toContain("date_trunc('milliseconds', ${projectTasks.updatedAt})");
  });

  it("rechecks sprint and release prerequisites inside their transactions", () => {
    const completeStart = source.indexOf("export async function completeProjectSprint");
    // Open tasks are re-read under lock inside the transaction and carried to the backlog.
    const taskCheck = source.indexOf('ne(projectTasks.status, "DONE")', completeStart);
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
    expect(source).toContain("projectAllowsExecution(project.status)");
    expect(source).toContain('.for("update")');
    // Only sprints may be set COMPLETED here; the project row itself is never
    // updated (so never reopened/completed) by the lifecycle service.
    expect(source).not.toMatch(/\.update\(projects\)/);
    expect(source.match(/status: "COMPLETED"/g)?.length ?? 0).toBe(
      source.match(/\.update\(projectSprints\)[\s\S]{0,80}status: "COMPLETED"/g)?.length ?? 0,
    );
  });
});
