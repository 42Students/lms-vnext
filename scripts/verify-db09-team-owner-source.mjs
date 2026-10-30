#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const placements = readFileSync(resolve("src/db/schema/placements.ts"), "utf8");
const collaboration = readFileSync(resolve("src/db/schema/tpo-collaboration.ts"), "utf8");
const candidate = readFileSync(
  resolve("docs/planning/sql/db09-team-owner-lifecycle-candidate.sql"),
  "utf8",
);
const db08 = JSON.parse(readFileSync(
  resolve("docs/planning/db-pass4-columns-db08_placement_policy_and_outcomes.json"),
  "utf8",
));
const db09 = JSON.parse(readFileSync(
  resolve("docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json"),
  "utf8",
));

const checks = [];
function check(name, fn) {
  fn();
  checks.push(name);
}

function field(inventory, tableName, columnName) {
  const table = inventory.tables.find((entry) => entry.table === tableName);
  assert.ok(table, `missing frozen table ${tableName}`);
  const row = table.rows.find((entry) => entry.legacyColumn === columnName);
  assert.ok(row, `missing frozen field ${tableName}.${columnName}`);
  return row;
}

check("frozen DB08 inventory contains mutable job owner", () => {
  const row = field(db08, "job", "owner_faculty_id");
  assert.match(row.sourceDefinition, /Drive owner/i);
  assert.ok(row.history.some((h) => h.migration === "V161__tpo_v1_drives.sql"));
});

check("frozen DB09 inventory contains recruiter-lead owner", () => {
  const row = field(db09, "recruiter_lead", "owner_faculty_id");
  assert.match(row.sourceDefinition, /INT|int/);
});

check("registered placement_jobs preserves creator and now carries scoped mutable owner identity", () => {
  const start = placements.indexOf("export const placementJobs");
  const end = placements.indexOf("export const placementJobRoleOptions", start);
  const job = placements.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(job, /createdByUserId: uuid\("created_by_user_id"\)/);
  assert.match(job, /ownerMembershipId: uuid\("owner_membership_id"\)/);
  assert.match(job, /name: "placement_jobs_owner_college_fk"/);
  assert.match(job, /columns: \[table\.ownerMembershipId, table\.collegeId\]/);
  assert.match(job, /foreignColumns: \[collegeMemberships\.id, collegeMemberships\.collegeId\]/);
});

check("current collaboration schema models delegated placement team roles", () => {
  const start = collaboration.indexOf("export const placementTpoTeamMembers");
  const end = collaboration.indexOf("export const placementRecruiterApplicantNotes", start);
  const team = collaboration.slice(start, end);
  assert.match(team, /'TPO_ADMIN','FACULTY_COORDINATOR'/);
  assert.match(team, /membershipId: uuid\("membership_id"\)/);
  assert.match(team, /collegeId: uuid\("college_id"\)/);
});

check("candidate keeps creator and stages separate owner membership", () => {
  assert.match(candidate, /ALTER TABLE placement_jobs[\s\S]*ADD COLUMN owner_membership_id uuid/);
  assert.doesNotMatch(candidate, /DROP COLUMN created_by_user_id|RENAME COLUMN created_by_user_id/);
  assert.match(candidate, /db069_job_owner_college_fk/);
});

check("live DRAFT/PUBLISHED jobs require owner after conservative backfill", () => {
  assert.match(candidate, /db069_owner_preflight/);
  assert.match(candidate, /db069_live_job_owner_ck/);
  assert.match(candidate, /status NOT IN \('DRAFT','PUBLISHED'\)[\s\S]*owner_membership_id IS NOT NULL/);
  assert.match(candidate, /m\.user_id = j\.created_by_user_id/);
});

check("delegated coordinator ownership is operation-specific", () => {
  assert.match(candidate, /db069_has_active_drive_owner/);
  assert.match(candidate, /r\.role IN \('TPO','COLLEGE_ADMIN'\)/);
  assert.match(candidate, /tm\.role IN \('TPO_ADMIN','FACULTY_COORDINATOR'\)/);
  assert.match(candidate, /db09_has_active_tpo_actor\(p_actor_user_id,p_college_id\)/);
});

check("lead and drive owner writes require active placement-owner scope", () => {
  assert.match(candidate, /db069_job_owner_scope/);
  assert.match(candidate, /db069_lead_owner_scope/);
  assert.match(candidate, /db069_has_active_drive_owner/);
});

check("direct team identity removal/change refuses owned leads and live jobs", () => {
  assert.match(candidate, /db069_team_member_owned_leads/);
  assert.match(candidate, /db069_team_member_owned_drives/);
  assert.match(candidate, /db069_team_member_identity_guard/);
  assert.match(candidate, /UPDATE OF college_id,membership_id OR DELETE/);
  assert.match(candidate, /j\.status IN \('DRAFT','PUBLISHED'\)/);
});

check("atomic reassign moves leads and all jobs before delete", () => {
  const fnStart = candidate.indexOf("CREATE FUNCTION db069_reassign_and_remove_tpo_team_member");
  const fn = candidate.slice(fnStart);
  const leadUpdate = fn.indexOf("UPDATE placement_tpo_leads");
  const jobUpdate = fn.indexOf("UPDATE placement_jobs");
  const teamDelete = fn.indexOf("DELETE FROM placement_tpo_team_members");
  assert.ok(leadUpdate >= 0 && jobUpdate > leadUpdate && teamDelete > jobUpdate);
  assert.match(fn, /WHERE college_id=p_college_id[\s\S]*owner_membership_id=p_from_membership_id/);
});

check("owner assignment and removal share transaction lock", () => {
  assert.match(candidate, /CREATE FUNCTION db069_lock_owner_identity/);
  assert.match(candidate, /pg_advisory_xact_lock/);
  assert.match(candidate, /CREATE TRIGGER db069_job_owner_scope_guard/);
  assert.match(candidate, /CREATE TRIGGER db069_lead_owner_serialization_guard/);
  assert.match(candidate, /CREATE TRIGGER db069_team_member_identity_guard/);
});

check("lock ordering includes full college+membership identity", () => {
  assert.match(candidate, /v_old_college::text \|\| ':' \|\| v_old_owner::text/);
  assert.match(candidate, /v_new_college::text \|\| ':' \|\| v_new_owner::text/);
  assert.match(candidate, /v_new_key < v_old_key/);
});

check("self removal and invalid target are fail closed", () => {
  assert.match(candidate, /db069_team_self_remove/);
  assert.match(candidate, /db069_team_reassign_target_scope/);
  assert.match(candidate, /db069_team_reassign_distinct/);
});

process.stdout.write(JSON.stringify({
  task: "DB-069",
  status: "SOURCE_ASSERTIONS_PASSED",
  assertions: checks.length,
  checks,
}, null, 2) + "\n");
