import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const service = read("src/modules/groups/service.ts");
const eligibility = read("src/modules/groups/elective-eligibility.ts");
const roster = read("src/modules/groups/roster-access.ts");
const electivesService = read("src/modules/electives/service.ts");
const schema = read("src/db/schema/academics.ts");
const registeredDb02 = read("drizzle/0303_db02_academic_timetable_registered.sql");
const registeredDb03 = read("drizzle/0306_db03_elective_kernel_integrity.sql");
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

test("read and write paths both reject impossible or nonconsecutive elective years", () => {
  assert.ok(electivesService.includes("if (start < 1900 || start > 9998)"));
  assert.ok(roster.includes("left(${electiveSlots.academicYear}, 4)::integer between 1900 and 9998"));
  assert.ok(roster.includes("length(${electiveSlots.academicYear}) - 5)::integer in"));
  assert.ok(roster.includes("else false"));
  assert.ok(rosterTests.includes("impossibleEnd"));
});

test("DB03 roster source is not duplicated or truncated", () => {
  for (const name of ["listActiveElectiveLearnersForDelivery",
    "listActiveElectiveDeliveryIds", "hasActiveElectiveDeliveryAccess",
    "isElectiveBackedDelivery", "listBoundElectiveDeliveryIds"]) {
    assert.equal(roster.split("export async function " + name + "(").length - 1, 1);
  }
  assert.equal(roster.split("function activeRosterQuery(").length - 1, 1);
  assert.equal(roster.split("`").length % 2, 1);
  assert.match(roster, /when \$\{electiveSlots\.academicYear\} ~/);
});
test("elective offering edits reject disabled and soft-deleted courses", () => {
  const edit = electivesService.slice(electivesService.indexOf(
    "export async function updateCollegeElectiveOffering("),
    electivesService.indexOf("export async function archiveCollegeElectiveOffering("));
  assert.match(edit, /courseEnabled:\\s*courses\\.enabled/);
  assert.match(edit, /courseDeletedAt:\\s*courses\\.deletedAt/);
  assert.match(edit, /!delivery\\.courseEnabled/);
  assert.match(edit, /delivery\\.courseDeletedAt !== null/);
  assert.match(rosterTests,
    /rejects elective reassignment to disabled or deleted courses without mutating/);
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

test("registered DB02 and DB03 migrations enforce canonical term/year instead of period-only eligibility", () => {
  assert.match(registeredDb02, /CREATE TABLE IF NOT EXISTS cohort_progression_state/);
  assert.match(registeredDb02, /current_term_number integer NOT NULL DEFAULT 1/);
  assert.match(registeredDb02, /current_academic_year_start integer/);
  assert.match(registeredDb03, /cp\.current_term_number=x\.semester_number/);
  assert.match(registeredDb03, /cp\.current_academic_year_start=y/);
  assert.match(eligibility, /cohortProgressionState\.currentTermNumber/);
  assert.match(roster, /cps\.current_term_number = \$\{electiveSlots\.semesterNumber\}/);
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

test("historical stage is not mistaken for the now-registered DB03 enforcement", () => {
  assert.match(db03, /STAGING ONLY; NOT A NUMBERED DRIZZLE MIGRATION/);
  assert.match(registeredDb03, /CREATE TRIGGER db03_elective_member_academics_guard/);
  assert.match(registeredDb03, /CREATE TRIGGER db03_elective_offering_program_guard/);
  assert.match(registeredDb03, /DB03 elective max_pick exceeded/);
});
