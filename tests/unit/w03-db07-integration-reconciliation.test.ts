import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sql = (name: string) =>
  readFileSync(join(root, "docs/planning/sql", name), "utf8");

const workspace = sql("db07-w03-workspace-state-parity-candidate.sql");
const supersededWorkspace = sql("db07-w03-admin-workspace-state-candidate.sql");
const taskAllocation = sql("db07-w03-task-allocation-parity-candidate.sql");
const backlog = sql("db07-w03-task-backlog-and-delivery-state-candidate.sql");
const core = sql("db07-w03-core-project-relationship-integrity-candidate.sql");

describe("W03 DB07 staged integration ownership", () => {
  it("keeps exactly one promotable workspace-state draft", () => {
    expect(workspace).toContain("CANONICAL W03 DB07 WORKSPACE-STATE PROMOTION INPUT");
    expect(supersededWorkspace).toContain("SUPERSEDED FOR PROMOTION");
    expect(supersededWorkspace).toContain("DO NOT PROMOTE");
  });

  it("models readiness as true/false/null with provenance for both non-null values", () => {
    expect(workspace).toContain("readiness_override IS NULL");
    expect(workspace).toContain("readiness_override IS NOT NULL");
    expect(workspace).toContain("readiness_override_by_user_id IS NOT NULL");
    expect(workspace).toContain("readiness_override_at IS NOT NULL");
    expect(workspace).toContain("length(readiness_override_note) <= 2000");
  });

  it("keeps mentorless restore parity without persisting a previous status", () => {
    expect(workspace).toContain("'BLOCKED'");
    expect(workspace).toContain("status_before_delete is intentionally NOT persisted");
    expect(workspace).not.toMatch(/ADD COLUMN status_before_delete/i);
  });

  it("assigns carry-over DDL to the backlog draft only", () => {
    expect(backlog).toMatch(/ADD COLUMN carried_over_from_sprint_id/i);
    expect(backlog).toContain("project_tasks_project_carryover_sprint_fk");
    expect(taskAllocation).not.toMatch(/ADD COLUMN carried_over_from_sprint_id/i);
    expect(taskAllocation).not.toContain("project_tasks_carryover_same_project_fk");
  });

  it("assigns the active same-project sprint FK to the core relationship draft only", () => {
    expect(core).toContain("project_sprints_project_id_id_uq");
    expect(core).toContain("ADD CONSTRAINT project_tasks_project_sprint_fk");
    expect(backlog).not.toContain("ADD CONSTRAINT project_tasks_project_sprint_fk");
    expect(backlog).toContain("core-project-relationship-integrity-candidate.sql");
  });
});
