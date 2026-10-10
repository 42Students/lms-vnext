import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const review = JSON.parse(
  fs.readFileSync("docs/planning/db07-w03-field-review.json", "utf8"),
);

test("DB07 keeps every current Project source field active and unverified", () => {
  assert.equal(review.counts.tables, 16);
  assert.equal(review.counts.fields, 358);
  assert.equal(review.counts.verified, 0);
  assert.equal(review.counts.approvedRetired, 0);
  assert.equal(review.rows.length, 358);

  assert.ok(
    review.rows.every(
      (row) =>
        row.sourceDisposition === "ACTIVE_SOURCE_CONTRACT" &&
        row.reconciliationStatus ===
          "SOURCE_ACTIVE_TARGET_SEMANTICS_UNVERIFIED" &&
        row.semanticStatus === "UNVERIFIED" &&
        row.sqlExecution === "NOT_EXECUTED" &&
        row.approvedRetirement === false,
    ),
  );
});

test("DB07 missing target concepts stay explicit", () => {
  assert.deepEqual(
    [...review.sharedPhaseReconciliation.missingDedicatedTargetConcepts].sort(),
    [
      "project_delivery_event",
      "project_meeting_history",
      "project_resource_audit",
      "project_task_comment",
    ].sort(),
  );
  assert.deepEqual(
    [...review.counts.missingTargetTables].sort(),
    [...review.sharedPhaseReconciliation.missingDedicatedTargetConcepts].sort(),
  );
  assert.equal(
    review.sharedPhaseReconciliation.runtimeVerification,
    "BLOCKED_BY_DB-001",
  );
});

test("DB07 staged SQL remains outside the migration journal and preserves core invariants", () => {
  const read = (name) =>
    fs.readFileSync(`docs/planning/sql/${name}`, "utf8");

  const relationship = read(
    "db07-w03-core-project-relationship-integrity-candidate.sql",
  );
  const task = read(
    "db07-w03-task-allocation-parity-candidate.sql",
  );
  const workspace = read(
    "db07-w03-workspace-state-parity-candidate.sql",
  );

  for (const sql of [relationship, task, workspace]) {
    assert.match(sql, /DRAFT ONLY/);
  }

  for (const constraint of [
    "project_sprints_project_release_fk",
    "project_tasks_project_sprint_fk",
    "project_task_submissions_project_task_fk",
    "project_submission_reviews_project_submission_fk",
    "project_evaluations_project_submission_fk",
    "project_meetings_project_sprint_fk",
    "project_meetings_project_task_fk",
  ]) {
    assert.ok(relationship.includes(constraint));
  }

  for (const token of [
    "assignee_project_member_id",
    "blocker_reason",
    "carried_over_from_sprint_id",
    "version bigint",
  ]) {
    assert.ok(task.includes(token));
  }

  for (const token of [
    "readiness_override",
    "deleted_at",
    "deleted_by_user_id",
    "recoverable_content",
    "version bigint",
  ]) {
    assert.ok(workspace.includes(token));
  }
});
