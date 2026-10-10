import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "docs/planning/sql/db07-w03-core-project-relationship-integrity-candidate.sql",
  ),
  "utf8",
);

describe("W03 DB07 staged same-project relationship contract", () => {
  it("keeps the staged draft outside the shared migration journal", () => {
    expect(sql).toContain("DRAFT ONLY");
    expect(sql).toContain("W01 is the sole migration-journal owner");
  });

  it("stages composite targets for releases, sprints, tasks and submissions", () => {
    for (const index of [
      "project_releases_project_id_id_uq",
      "project_sprints_project_id_id_uq",
      "project_tasks_project_id_id_uq",
      "project_submissions_project_id_id_uq",
    ]) {
      expect(sql).toContain(index);
    }
  });

  it("stages cross-project protection for every live parent-child project link", () => {
    for (const constraint of [
      "project_sprints_project_release_fk",
      "project_tasks_project_sprint_fk",
      "project_task_submissions_project_task_fk",
      "project_submission_reviews_project_submission_fk",
      "project_evaluations_project_submission_fk",
      "project_meetings_project_sprint_fk",
      "project_meetings_project_task_fk",
    ]) {
      expect(sql).toContain(constraint);
    }
    expect(sql).toContain("SQLSTATE 23503");
  });
});
