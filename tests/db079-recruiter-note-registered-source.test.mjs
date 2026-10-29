import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
const prior = JSON.parse(readFileSync("drizzle/meta/0311_snapshot.json", "utf8"));
const current = JSON.parse(readFileSync("drizzle/meta/0312_snapshot.json", "utf8"));
const sql = readFileSync("drizzle/0312_db09_recruiter_note_grant_on_update.sql", "utf8");

test("DB079 forward-only migration is uniquely registered after 0311", () => {
  const e = journal.entries.at(-1);
  assert.equal(e.idx, 312);
  assert.equal(e.tag, "0312_db09_recruiter_note_grant_on_update");
  assert.equal(journal.entries.filter(x => x.tag === e.tag).length, 1);
  assert.equal(current.prevId, prior.id);
  assert.notEqual(current.id, prior.id);
});
test("DB079 replaces only grant-check trigger, no table or data mutation", () => {
  const {id: a, prevId: b, ...priorShape} = prior;
  const {id: c, prevId: d, ...newShape} = current;
  assert.deepEqual(newShape, priorShape);
  assert.match(sql, /to_regprocedure\('db09_assert_recruiter_private_note_scope\(\)'\)/);
  assert.match(sql, /CREATE OR REPLACE TRIGGER db09_recruiter_private_note_scope_guard\s+BEFORE INSERT OR UPDATE\s+ON placement_recruiter_applicant_notes/);
  assert.doesNotMatch(sql, /UPDATE OF recruiter_user_id/);
  assert.doesNotMatch(sql, /\b(?:CREATE|ALTER|DROP)\s+TABLE\b/i);
  assert.doesNotMatch(sql, /\bUPDATE\s+placement_recruiter_applicant_notes\b/i);
  assert.doesNotMatch(sql, /\bDELETE\s+FROM\b/i);
});
