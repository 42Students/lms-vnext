import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/modules/groups/roster-access.ts", import.meta.url), "utf8");

test("DB008 learner elective roster query is complete and has one authorized export path", () => {
  for (const name of [
    "listActiveElectiveDeliveryIds",
    "hasActiveElectiveDeliveryAccess",
    "isElectiveBackedDelivery",
    "listBoundElectiveDeliveryIds",
  ]) {
    assert.equal(source.split("export async function " + name + "(").length - 1, 1, name);
  }
  assert.equal(source.split("function activeRosterQuery(").length - 1, 1);
  assert.match(source, /eq\(courseOfferings\.type, "ELECTIVE"\)/);
  assert.match(source, /join cohort_progression_state cps on cps\.cohort_id = lpe\.cohort_id/);
  assert.match(source, /cps\.current_term_number = \$\{electiveSlots\.semesterNumber\}/);
  assert.ok(source.includes("(-[0-9]{2}|-[0-9]{4})?$'"), "full year regex is anchored");
  // Progressive-year guard is numeric and validates the entire year label.
  // A cohort without an explicitly set academic-year start remains eligible,
  // but a populated start must exactly equal the slot year.
  assert.match(source, /left\(\$\{electiveSlots\.academicYear\},\s*4\)::integer between 1900 and 9998/);
  assert.match(source, /cps\.current_academic_year_start is null/);
  assert.match(source, /cps\.current_academic_year_start\s*=\s*left\(\$\{electiveSlots\.academicYear\},\s*4\)::integer/);
  // Reject mismatched second-year suffixes, rather than trusting a
  // malformed string that happens to share the same first four digits.
  assert.match(source, /right\(\$\{electiveSlots\.academicYear\},\s*length\(\$\{electiveSlots\.academicYear\}\) - 5\)::integer in/);
  assert.match(source, /else false\s*end/);
  assert.match(source, /and lpe\.program_id = \$\{electiveSlots\.programId\}/);
  assert.equal(source.split(".where(and(...conditions))").length - 1, 1);
});
