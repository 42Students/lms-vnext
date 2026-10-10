import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "docs/planning/sql/db07-w03-tenant-project-integrity-candidate.sql",
  ),
  "utf8",
);

describe("W03 DB07 staged tenant/project integrity", () => {
  it("keeps project team groups in the same college", () => {
    expect(sql).toContain("lms_groups_college_id_id_uq");
    expect(sql).toContain("project_instances_team_group_same_college_fk");
    expect(sql).toContain("FOREIGN KEY (college_id, team_group_id)");
  });

  it("guards every current project membership-bearing child", () => {
    for (const trigger of [
      "project_members_same_college_membership",
      "project_task_submissions_same_college_memberships",
      "project_submissions_same_college_memberships",
      "project_evaluations_same_college_membership",
      "project_meetings_same_college_memberships",
    ]) {
      expect(sql).toContain("CREATE TRIGGER " + trigger);
    }
    expect(sql).toContain("w03_assert_project_membership_same_college");
    expect(sql).toContain("USING ERRCODE = '23503'");
  });

  it("guards staged project history actors without trusting actor_type", () => {
    for (const trigger of [
      "project_meeting_history_actor_same_college",
      "project_resource_audit_actor_same_college",
      "project_delivery_events_actor_same_college",
      "project_task_comments_actor_same_college",
    ]) {
      expect(sql).toContain("CREATE TRIGGER " + trigger);
    }
    expect(sql).toContain("w03_assert_project_actor_same_college");
    expect(sql).toContain("CAST(sr.role AS text) = 'SUPER_ADMIN'");
  });

  it("does not invent a DB mirror trigger for group-managed learners yet", () => {
    expect(sql).toContain("PROJECT_TEAM_GROUP_MANAGED");
    expect(sql).toContain("Project-team learner mirroring remains a service transaction invariant");
  });
});
