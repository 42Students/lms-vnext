import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");

test("DB09 canonical CRM premerge is single-copy and syntactically shaped", () => {
  const sql = read("docs/planning/sql/db09-tpo-crm-premerge.sql");
  const count = (needle) => sql.split(needle).length - 1;
  assert.equal(count("CREATE TABLE placement_tpo_leads"), 1);
  assert.equal(count("CREATE TABLE placement_tpo_lead_activities"), 1);
  assert.equal(count("CREATE TABLE placement_tpo_followups"), 1);
  assert.equal(count("CREATE FUNCTION db09_assert_lead_scoped_links"), 1);
  assert.equal(count("CREATE FUNCTION db09_assert_activity_actor_scope"), 1);
  assert.match(sql, /phone_norm ~ '\^\[0-9\]\{7,20\}\$'/);
  assert.match(sql, /invite_token_hash ~ '\^\[a-f0-9\]\{64\}\$'/);
});

test("DB09 duplicate staging files remain explicit tombstones", () => {
  for (const path of [
    "docs/planning/sql/db09-crm-scoped-fk-candidate.sql",
    "docs/planning/sql/db09-crm-tenant-fk-candidate.sql",
    "docs/planning/sql/db09-scheduling-premerge.sql",
    "docs/planning/sql/db09-notification-intents-candidate.sql",
    "docs/planning/sql/db09-final-recruiter-codes-candidate.sql",
  ]) {
    assert.match(read(path), /^-- SUPERSEDED/m, path + " must not become a second canonical migration");
  }
});

test("DB09 canonical scheduling includes coordinator and final recruiter code", () => {
  const sql = read("docs/planning/sql/db09-round-scheduling-candidate.sql");
  assert.match(sql, /CREATE TABLE placement_round_slots/);
  assert.match(sql, /CREATE TABLE placement_round_assignments/);
  assert.match(sql, /CREATE TABLE placement_round_reschedule_requests/);
  assert.match(sql, /CREATE TABLE placement_drive_coordinator_assignments/);
  assert.match(sql, /'RECRUITER'/);
});

test("DB09 canonical notification draft preserves undo, digest and claim state", () => {
  const sql = read("docs/planning/sql/db09-notification-undo-digest-candidate.sql");
  assert.match(sql, /CREATE TABLE placement_notification_undo_groups/);
  assert.match(sql, /CREATE TABLE placement_notification_intents/);
  assert.match(sql, /undo_deadline/);
  assert.match(sql, /digest_day/);
  assert.match(sql, /claim_lease_expires_at/);
  assert.match(sql, /'RECRUITER'/);
  assert.match(sql, /'APP','EMAIL','SMS'/);
});


test("DB09 parent composite keys are centralized once", () => {
  const parents = read("docs/planning/sql/db09-parent-composite-keys-candidate.sql");
  for (const shape of [
    "UNIQUE (id, organization_id)",
    "UNIQUE (id, college_id)",
    "UNIQUE (id, job_id)",
    "UNIQUE (id, organization_id, college_id)",
  ]) {
    assert.match(parents, new RegExp(shape.replace(/[()]/g, "\\$&")));
  }

  for (const path of [
    "docs/planning/sql/db09-collaboration-scoped-fk-candidate.sql",
    "docs/planning/sql/db09-round-scheduling-candidate.sql",
    "docs/planning/sql/db09-notification-undo-digest-candidate.sql",
  ]) {
    const sql = read(path);
    assert.doesNotMatch(
      sql,
      /ADD CONSTRAINT .*_(?:id_college|id_job|college_id|event_scope|college_org)_.*UNIQUE/s,
      path + " must not redeclare shared parent composite keys",
    );
  }
});

test("DB09 collaboration and scheduling agree on coordinator table identity", () => {
  const collaboration = read("docs/planning/sql/db09-collaboration-scoped-fk-candidate.sql");
  const scheduling = read("docs/planning/sql/db09-round-scheduling-candidate.sql");
  assert.match(scheduling, /CREATE TABLE placement_drive_coordinator_assignments/);
  assert.doesNotMatch(collaboration, /placement_drive_day_coordinator_assignments/);
  assert.match(
    collaboration,
    /Coordinator tenant negatives execute through the canonical scheduling/,
  );
});

test("DB09 composite child FKs use the canonical ID-first parent shapes", () => {
  const collaboration = read("docs/planning/sql/db09-collaboration-scoped-fk-candidate.sql");
  assert.match(
    collaboration,
    /FOREIGN KEY\(job_id, college_id\) REFERENCES placement_jobs\(id, college_id\)/,
  );
  assert.match(
    collaboration,
    /FOREIGN KEY\(learner_membership_id, college_id\)[\s\S]*REFERENCES college_memberships\(id, college_id\)/,
  );
  assert.match(
    collaboration,
    /FOREIGN KEY\(application_id, job_id\)[\s\S]*REFERENCES placement_applications\(id, job_id\)/,
  );
});


test("DB09 college settings are structural, not post-create ALTERs", () => {
  const schema = read("src/db/schema/tpo-collaboration.ts");
  for (const field of [
    'jobTypes: jsonb("job_types")',
    'outcomeLabels: jsonb("outcome_labels")',
    'recruiterAccessMonths: integer("recruiter_access_months")',
    'recruiterDriveNeedsApproval: boolean("recruiter_drive_needs_approval")',
  ]) {
    assert.match(schema, new RegExp(field.replace(/[()]/g, "\\$&")));
  }
  assert.match(schema, /jsonb_typeof\(\$\{table\.jobTypes\}\) = 'object'/);
  assert.match(schema, /jsonb_typeof\(\$\{table\.outcomeLabels\}\) = 'array'/);

  const recruiterDraft = read(
    "docs/planning/sql/db09-college-recruiter-settings-candidate.sql",
  );
  assert.match(recruiterDraft, /^-- SUPERSEDED/m);
  assert.doesNotMatch(recruiterDraft, /^ALTER TABLE/m);

  const v190 = read("docs/planning/sql/db09-job-outcome-settings-candidate.sql");
  assert.match(v190, /SOURCE REFERENCE ONLY/);
  assert.doesNotMatch(v190, /^ALTER TABLE/m);
});


test("DB09 staged SQL avoids non-executable JSON CHECK subqueries", () => {
  const sql = read("docs/planning/sql/db09-company-export-preference-candidate.sql");
  assert.doesNotMatch(sql, /CHECK\s*\([\s\S]*?NOT EXISTS\s*\(\s*SELECT/i);
  assert.match(sql, /share_column_defaults\s*<@/);
  assert.match(sql, /jsonb_typeof\(share_column_defaults\) = 'array'/);
});

test("DB09 notification intents reference encrypted DB10 child and close sent state", () => {
  const sql = read("docs/planning/sql/db09-notification-undo-digest-candidate.sql");
  assert.match(
    sql,
    /encrypted_outbound_ref_id uuid[\s\S]*REFERENCES outbound_messages\(id\) ON DELETE RESTRICT/,
  );
  assert.match(
    sql,
    /status NOT IN \('APP_PUBLISHED','PROVIDER_ACCEPTED','DELIVERED'\)[\s\S]*AND sent_at IS NULL/,
  );
});

test("DB09 prep FK depends on centralized parent key", () => {
  const sql = read("docs/planning/sql/db09-prep-bell-read-state-candidate.sql");
  assert.match(sql, /db09-parent-composite-keys-candidate\.sql/);
  assert.match(
    sql,
    /FOREIGN KEY \(learner_membership_id, college_id\)[\s\S]*REFERENCES college_memberships\(id, college_id\)/,
  );
});
