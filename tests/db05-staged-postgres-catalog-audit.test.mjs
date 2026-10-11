import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const probe = read("scripts/db05-staged-schema-db-audit.mjs");
const discussion = read("src/db/schema/db05-lesson-discussions.staged.ts");
const settings = read("src/db/schema/db05-lesson-settings.staged.ts");
const manifest = JSON.parse(read("docs/planning/db05-migration-readiness-manifest.json"));

test("DB05 catalog probe requires explicit disposable non-production opt-in", () => {
  assert.match(probe, /DB05_DISPOSABLE_DATABASE_URL/);
  assert.match(probe, /DB05_ALLOW_READONLY_PROBE/);
  assert.match(probe, /YES_ON_NONPROD/);
  assert.match(probe, /NODE_ENV === "production"/);
  assert.match(probe, /prod\|production/);
  assert.match(probe, /BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY/);
  assert.match(probe, /if \(!report\.passed\) process\.exitCode = 2/);
});

test("DB05 catalog probe inspects only system metadata, not production data", () => {
  assert.match(probe, /information_schema\.columns/);
  assert.match(probe, /pg_constraint/);
  assert.match(probe, /pg_indexes/);
  assert.match(probe, /pg_trigger/);
  assert.match(probe, /pg_get_functiondef/);
  const sqlCalls = [...probe.matchAll(/client\.query\(\s*"([^"]+)"/g)].map(m => m[1]);
  assert.ok(sqlCalls.includes("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY"));
  for (const sql of sqlCalls) {
    assert.doesNotMatch(sql, /^(?:UPDATE|INSERT|DELETE|TRUNCATE|CREATE|ALTER|DROP)\b/i, sql);
  }
  assert.doesNotMatch(probe, /process\.stdout\.write\(url\)/);
  assert.doesNotMatch(probe, /parsed\.password/);
});

test("DB05 two typed staged schemas must remain separate from runtime schema barrel", () => {
  assert.match(discussion, /UNREGISTERED STAGED ONLY/);
  assert.match(settings, /UNREGISTERED STAGED ONLY/);
  assert.match(probe, /lesson_content_discussions_parent_content_fk/);
  assert.match(probe, /lesson_content_settings_pkey/);
  assert.match(probe, /discussion\.tenant_guard_strengthened/);
  assert.match(probe, /section_cohort_id/);
  assert.match(probe, /course_department_college_id/);
});

test("DB05 catalog success must not count for other gates", () => {
  assert.equal(manifest.artifacts.length, 7);
  assert.ok(manifest.artifacts.every(a => !a.registered && !a.executedAgainstPostgres));
  assert.ok(manifest.gates.some(g => g.id === "CLEAN_POSTGRES_REPLAY" && g.status !== "PASS"));
  assert.ok(manifest.gates.some(g => g.id === "LESSON_DISCUSSIONS_SAME_COLLEGE_FULL_PATH_GUARD" && g.status !== "PASS"));
});
