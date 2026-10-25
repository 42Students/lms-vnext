import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Static tests for an UNREGISTERED SQL draft, not a disposable PostgreSQL run.
const canonical = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
).replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");
// Both guards are consolidated into canonical DB02 SQL; isolate this function
// and its trigger to avoid matching other curriculum clauses in the whole draft.
const promotionStart = canonical.indexOf("CREATE FUNCTION db02_guard_cohort_promotion_readiness()");
const promotionEnd = canonical.indexOf("CREATE FUNCTION db02_record_cohort_progression_event()", promotionStart);
const draft = canonical.slice(promotionStart, promotionEnd);
// Promotion implementation obligations are documented immediately before the
// trigger declaration, outside the PL/pgSQL function body.
const promotionContract = canonical.slice(
  canonical.lastIndexOf("-- Source-parity semester promotion", promotionStart),
  promotionEnd,
);
const acceptance = readFileSync(
  new URL("../scripts/sql/db02-promotion-readiness-acceptance-unregistered.sql", import.meta.url),
  "utf8",
);

test("canonical promotion guard has exactly one paired function body", () => {
  assert.match(draft, /CREATE FUNCTION db02_guard_cohort_promotion_readiness\(\)/);
  assert.match(draft, /RETURNS trigger LANGUAGE plpgsql AS \$\$/);
  assert.equal([...draft.matchAll(/\$\$/g)].length, 2);
  assert.match(draft, /CREATE TRIGGER db02_cohort_promotion_readiness_guard/);
  assert.match(canonical, /CREATE TRIGGER db02_cohort_promotion_readiness_guard/);
});

test("promotions only from ACTIVE cohorts and to active program-specific terms", () => {
  assert.match(draft, /v_cohort_status <> 'ACTIVE'/);
  assert.match(draft, /pt\.program_id = v_program_id/);
  assert.match(draft, /pt\.term_number = NEW\.current_term_number/);
  assert.match(draft, /v_term_active IS DISTINCT FROM true/);
  assert.match(draft, /FROM cohorts c[\s\S]*?FOR SHARE/);
  assert.match(draft, /FROM program_terms pt[\s\S]*?FOR SHARE/);
});

test("destination must retain a course row while promotion transaction commits", () => {
  assert.match(draft, /FROM program_term_courses ptc[\s\S]*?FOR SHARE/);
  assert.match(draft, /WHERE ptc\.program_term_id = v_term_id/);
  assert.match(draft, /Promotion target term requires at least one mapped course/);
  assert.doesNotMatch(draft, /ptc\.type = 'CORE'/);
});

test("initialization and same-term correction do not demand completed curriculum", () => {
  assert.match(draft, /BEFORE UPDATE OF current_term_number\s+ON cohort_progression_state/);
  assert.match(draft, /NEW\.current_term_number IS NOT DISTINCT FROM OLD\.current_term_number/);
  assert.match(canonical, /New cohort progression must start at term 1, version 0/);
  assert.match(canonical, /Cohort promotion must advance exactly one term/);
  assert.match(canonical, /Cohort progression version must increment exactly once/);
});

test("PG acceptance covers absence, inactive, empty course, cohort inactive, valid promotion", () => {
  for (const message of [
    "promotion succeeded without configured destination term",
    "promotion succeeded into inactive destination term",
    "promotion succeeded into empty destination curriculum",
    "inactive cohort was allowed to promote",
    "promotion did not persist canonical state and exact history",
    "promotion bypassed missing third term",
    "failed promotion appended an immutable history event",
  ]) assert.ok(acceptance.includes(message), "missing acceptance case: " + message);
  assert.match(acceptance, /^BEGIN;/m);
  assert.match(acceptance, /^ROLLBACK;/m);
  assert.match(acceptance, /DB02 promotion readiness PASS/);
});

test("canonical CAS concurrency requirement is not silently replaced by a trigger", () => {
  assert.match(promotionContract, /version=:expectedVersion CAS predicate/);
  assert.match(promotionContract, /Staffing readiness is informational/);
  assert.match(promotionContract, /Faculty-teaching assignment deactivation must remain transactional/);
});

test("two-session race harness cannot pass on unrelated SQL errors", () => {
  const races = readFileSync(
    new URL("../scripts/sql/db02-promotion-readiness-concurrency-unregistered.sh", import.meta.url),
    "utf8",
  );
  assert.match(races, /ON_ERROR_STOP=1/);
  assert.match(races, /PROMOTE_RC=\$\?/);
  assert.match(races, /Promotion target program term must be configured and ACTIVE/);
  assert.match(races, /Promotion target term requires at least one mapped course/);
  assert.doesNotMatch(races, /grep -Eq '23514\|check constraint'/);
  assert.match(races, /RACE1_STATE/);
  assert.match(races, /RACE2_STATE/);
});


test("progression-backed program terms are retained while unused terms stay deletable", () => {
  const start = canonical.indexOf("CREATE FUNCTION db02_guard_program_term_delete_history()");
  const end = canonical.indexOf("CREATE TRIGGER db02_program_term_delete_history_guard", start);
  assert.ok(start !== -1 && end > start);
  const guard = canonical.slice(start, end);
  assert.match(guard, /FROM cohort_progression_state cps/);
  assert.match(guard, /cps\.current_term_number = OLD\.term_number/);
  assert.match(guard, /FROM cohort_progression_events cpe/);
  assert.match(guard, /cpe\.from_term_number = OLD\.term_number/);
  assert.match(guard, /cpe\.to_term_number = OLD\.term_number/);
  assert.match(
    guard,
    /Program term cannot be deleted after cohort progression references it/,
  );
  assert.match(acceptance, /program term referenced by progression history was deleted/);
  assert.match(acceptance, /unused program term could not be deleted/);
});
