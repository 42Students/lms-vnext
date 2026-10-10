import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sql(name: string) {
  return readFileSync(
    join(process.cwd(), "docs/planning/sql", name),
    "utf8",
  );
}

const task = sql(
  "db07-w03-task-allocation-parity-candidate.sql",
);
const workspace = sql(
  "db07-w03-workspace-state-parity-candidate.sql",
);

describe("W03 DB07 staged task/workspace parity contracts", () => {
  it("keeps both proposals explicitly outside the shared journal", () => {
    expect(task).toContain("DRAFT ONLY");
    expect(workspace).toContain("DRAFT ONLY");
    expect(task).toContain("W01 owns migration");
    expect(workspace).toContain("W01 owns migration");
  });

  it("normalizes task allocation onto project membership instead of legacy id/type/name triples", () => {
    expect(task).toContain("assignee_project_member_id");
    expect(task).toContain(
      "project_tasks_assignee_same_project_fk",
    );
    expect(task).toContain("estimate_points");
    expect(task).toContain("blocker_reason");
    expect(task).toContain("removed_from_template");
    expect(task).toContain("version bigint");
  });

  it("keeps recoverable delete distinct from archived status", () => {
    expect(workspace).toContain("deleted_at");
    expect(workspace).toContain("deleted_by_user_id");
    expect(workspace).toContain("PROJECTS_PROJECT_DELETED");
    expect(workspace).toContain("PROJECTS_PROJECT_RESTORED");
    expect(workspace).toContain(
      "Do not overload status='ARCHIVED'",
    );
  });

  it("stages readiness attribution and basic workspace planning fields", () => {
    for (const token of [
      "readiness_override",
      "readiness_override_note",
      "readiness_override_by_user_id",
      "readiness_override_at",
      "blocker text",
      "next_action text",
      "start_date date",
      "end_date date",
      "sprint_length_weeks",
      "estimation_unit",
      "version bigint",
    ]) {
      expect(workspace).toContain(token);
    }
  });
});
