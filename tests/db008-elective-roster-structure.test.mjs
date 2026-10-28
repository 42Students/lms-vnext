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
  assert.match(source, /left\(\$\{electiveSlots\.academicYear\},4\) = cps\.current_academic_year_start::text/);
  assert.match(source, /and lpe\.program_id = \$\{electiveSlots\.programId\}/);
  assert.equal(source.split(".where(and(...conditions))").length - 1, 1);
});
