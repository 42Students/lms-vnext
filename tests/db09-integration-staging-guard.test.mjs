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
