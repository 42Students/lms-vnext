import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const service = read("src/modules/groups/service.ts");
const eligibility = read("src/modules/groups/elective-eligibility.ts");
const roster = read("src/modules/groups/roster-access.ts");
const schema = read("src/db/schema/academics.ts");
const draft = read("scripts/sql/db02-academic-progression-and-rooms-staging.sql");
const db03 = read("scripts/sql/db03-elective-learner-integrity-post-db02-staging.sql");
const rosterTests = read("tests/integration/groups-db03-roster.test.ts");

test("joinGroup revalidates elective eligibility before idempotent return", () => {
  const join = service.slice(service.indexOf("export async function joinGroup("),
    service.indexOf("async function promoteEligibleWaitlist("));
  const eligibilityIndex = join.indexOf("await hasElectiveAcademicEligibility(tx, slot, memberId)");
  const earlyReturnIndex = join.indexOf('if (existing?.state === "ACTIVE" || existing?.state === "WAITLISTED") return existing;');
  assert.ok(eligibilityIndex >= 0 && earlyReturnIndex > eligibilityIndex);
  assert.match(join, /if \(slot\) await assertElectivePickLimit\(tx, slot, memberId\);/);
});

test("the slot matches the learner ACTIVE primary program rather than college alone", () => {
  assert.match(eligibility, /eq\(learnerProgramEnrollments\.programId, slot\.programId\)/);
  assert.match(eligibility, /eq\(learnerProgramEnrollments\.status, "ACTIVE"\)/);
  assert.match(eligibility, /eq\(sections\.cohortId, learnerProgramEnrollments\.cohortId\)/);
  assert.match(roster, /lpe\.program_id = \$\{electiveSlots\.programId\}/);
  assert.match(roster, /lpe\.status = 'ACTIVE' and se\.status = 'ACTIVE'/);
  assert.match(schema, /learner_program_enrollments_active_membership_uq/);
});

test("the program oracle is enforced on new join and stale ACTIVE membership", () => {
  assert.match(rosterTests, /rejects a first elective join from a different program in the same college/);
  assert.match(rosterTests, /An idempotent join must NOT report this stale ACTIVE membership as valid/);
  assert.match(rosterTests, /ELECTIVE_PRIMARY_SECTION_REQUIRED/);
  assert.match(rosterTests, /Both cohorts reference the same academic period/);
});

test("DB02 draft supplies the canonical term/year source and no period UUID shortcut", () => {
  assert.match(draft, /CREATE TABLE cohort_progression_state/);
  assert.match(draft, /current_term_number integer NOT NULL DEFAULT 1/);
  assert.match(draft, /current_academic_year_start integer/);
  assert.match(db03, /cps\.current_term_number = slot_semester/);
  assert.match(db03, /cps\.current_academic_year_start = slot_year_start/);
});

test("DB03 staged direct-SQL guard handles both ACTIVE and WAITLISTED, not unrelated groups", () => {
  assert.match(db03, /NEW\.state::text NOT IN \('ACTIVE', 'WAITLISTED'\)/);
  assert.match(db03, /IF group_kind IS DISTINCT FROM 'ELECTIVE'/);
  assert.match(db03, /BEFORE INSERT OR UPDATE OF group_id, membership_id, state/);
  assert.match(db03, /FOR EACH ROW EXECUTE FUNCTION db03_guard_elective_member_academics/);
  assert.match(db03, /IF NOT FOUND THEN[\s\S]*SQLSTATE|USING ERRCODE = '23514'/);
});

test("direct-SQL elective membership proof locks enrollment and progression state", () => {
  assert.match(db03, /FOR SHARE OF lpe, se, cps/);
  assert.match(db03, /JOIN cohort_progression_state cps ON cps\.cohort_id = lpe\.cohort_id/);
  assert.match(db03, /home\.cohort_id = lpe\.cohort_id/);
  assert.match(db03, /slot_period IS NULL OR se\.academic_period_id = slot_period/);
});

test("year policy matches legacy nullable-start comparison", () => {
  assert.match(db03, /slot_year_start IS NULL/);
  assert.match(db03, /cps\.current_academic_year_start IS NULL/);
  assert.match(db03, /slot_year !~ '\^\[0-9\]\{4\}/);
});

test("unregistered staged SQL is explicitly not a numbered migration", () => {
  assert.match(db03, /STAGING ONLY; NOT A NUMBERED DRIZZLE MIGRATION/);
  assert.match(db03, /Prerequisite: DB02 canonical cohort_progression_state/);
  assert.match(db03, /Do not register before DB02/);
});
