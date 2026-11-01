// DB19-P16 scoped meeting-source and conflict protections. Source-only, not PG17 acceptance.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const inventory = JSON.parse(read("docs/planning/db-pass4-columns-db07_projects.json"));
const review = JSON.parse(read("docs/planning/db07-w03-field-review.json"));
const oracle = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const meeting = read("src/modules/projects/meeting-service.ts");
const mentorReschedule = read("src/modules/projects/mentor-meeting-reschedule-service.ts");
const googleSync = read("src/modules/projects/mentor-google-meeting-sync-service.ts");

function auditP16SourceCoverage(source = inventory, decisions = review) {
  const errors = [], names = ["project_meeting", "project_meeting_history"];
  const expected = new Map();
  for (const [name, count] of [["project_meeting", 42], ["project_meeting_history", 15]]) {
    const tables = source.tables.filter(t => t.table === name);
    if (tables.length !== 1 || tables[0].rows.length !== count || tables[0].sourceFieldCount !== count) {
      errors.push("TABLE_OR_COUNT_DRIFT:" + name); continue;
    }
    for (const row of tables[0].rows) {
      const id = name + "." + row.legacyColumn;
      if (expected.has(id)) errors.push("DUPLICATED_FIELD:" + id);
      expected.set(id, row.sourceType);
    }
  }
  const seen = new Set();
  for (const row of decisions.rows.filter(r => names.includes(r.legacyTable))) {
    const key = row.legacyTable + "." + row.legacyColumn;
    if (seen.has(key) || !expected.has(key) || expected.get(key) !== row.sourceType) {
      errors.push("MISMATCHED_FIELD:" + key); continue;
    }
    seen.add(key);
    if (row.sourceDisposition !== "ACTIVE_SOURCE_CONTRACT" ||
        row.semanticStatus !== "UNVERIFIED" ||
        row.sqlExecution !== "NOT_EXECUTED" ||
        row.approvedRetirement !== false)
      errors.push("UNPROVEN_SEMANTIC_OR_RETIREMENT:" + key);
  }
  if (seen.size !== 57 || expected.size !== 57)
    errors.push("P16_FIELD_CENSUS_DRIFT");
  if (source.sourceSha !== oracle || decisions.sourceSha !== oracle ||
      decisions.legacyBackendSha !== oracle)
    errors.push("SOURCE_ORACLE_PIN_DRIFT");
  return errors;
}

function activeOverlapQuery(source, anchor) {
  const offset = source.indexOf(anchor);
  if (offset < 0) return "";
  const start = source.indexOf("const [conflict]", offset);
  if (start < 0) return "";
  const end = source.indexOf(".limit(1);", start);
  return end < 0 ? "" : source.slice(start, end + ".limit(1);".length);
}

function hasSoftDeleteGuard(query) {
  return /isNull\(projectMeetings\.deletedAt\)/.test(query) &&
         /projectMeetings\.startsAt/.test(query) &&
         /projectMeetings\.endsAt/.test(query) &&
         /inArray\(projectMeetings\.status/.test(query);
}

test("P16 source coverage is exactly 42+15 fields, with no forged retirement/runtime proof", () => {
  assert.deepEqual(auditP16SourceCoverage(), []);
  assert.equal(review.counts.verified, 0);
});

test("P16 source coverage fails on field identity, duplicate, and oracle pin mutation", () => {
  const changed = structuredClone(inventory);
  changed.tables.find(x => x.table === "project_meeting").rows[0].legacyColumn = "meeting_key";
  assert.ok(auditP16SourceCoverage(changed).length > 0);
  const forged = structuredClone(review);
  forged.sourceSha = "bad-sha";
  assert.ok(auditP16SourceCoverage(inventory, forged).includes("SOURCE_ORACLE_PIN_DRIFT"));
});

test("P16 learner request and mentor schedule conflicts ignore deleted meetings", () => {
  const request = activeOverlapQuery(meeting, "export async function requestProjectMeeting(");
  const schedule = activeOverlapQuery(meeting, "export async function scheduleProjectMeeting(");
  assert.ok(request && schedule, "missing conflict query");
  assert.ok(hasSoftDeleteGuard(request), "learner meeting request must exclude soft-deleted rows");
  assert.ok(hasSoftDeleteGuard(schedule), "mentor meeting schedule must exclude soft-deleted rows");
  assert.match(request, /projectMeetings\.requestedByMembershipId/);
  assert.match(schedule, /projectMeetings\.scheduledByUserId/);
});

test("P16 mentor reschedule and Google sync must share deleted-row exclusion", () => {
  const reschedule = activeOverlapQuery(mentorReschedule,
    "export async function rescheduleMentorMeeting(");
  assert.ok(hasSoftDeleteGuard(reschedule), "reschedule conflict query must exclude soft-deleted rows");
  assert.match(mentorReschedule, /pg_advisory_xact_lock/);
  const sync = googleSync.slice(googleSync.indexOf("const [overlap]"));
  assert.ok(hasSoftDeleteGuard(sync), "Google meeting sync conflict query must exclude soft-deleted rows");
});

test("P16 mutation rejects conflict query without soft-delete predicate", () => {
  const request = activeOverlapQuery(meeting, "export async function requestProjectMeeting(");
  const schedule = activeOverlapQuery(meeting, "export async function scheduleProjectMeeting(");
  const reschedule = activeOverlapQuery(mentorReschedule, "export async function rescheduleMentorMeeting(");
  for (const [name, query] of [["request",request],["schedule",schedule],["reschedule",reschedule]]) {
    assert.ok(hasSoftDeleteGuard(query), name);
    assert.equal(hasSoftDeleteGuard(query.replace("isNull(projectMeetings.deletedAt)", "")), false, name);
  }
});
