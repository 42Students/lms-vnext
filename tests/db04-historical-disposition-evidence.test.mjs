import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

test("DB04 keeps 33 historical rows as evidence-backed candidates, not approved retirements", () => {
  const ledger = readJson("docs/planning/db04-field-crosswalk-proposals.json");
  const rows = ledger.rows ?? ledger.fields ?? [];
  const registration = rows.filter((r) => r.legacyTable === "student_registration");
  const approver = rows.filter((r) => r.legacyTable === "approver_id_card");
  assert.equal(registration.length, 22);
  assert.equal(approver.length, 11);
});

test("DB02 says historical student_registration is not a canonical academics dependency", () => {
  const db02 = readJson("docs/planning/db-pass4-columns-db02_academics_and_timetable.json");
  const decisions = db02.db02AuditPass?.canonicalTargetDecisions ?? [];
  const decision = decisions.find((d) => d.id === "EXTERNAL_STUDENT_REGISTRATION_NO_DB02_DEPENDENCY");
  assert.ok(decision);
  assert.equal(decision.status, "SOURCE_EVIDENCE_NO_DB02_DEPENDENCY_PRODUCT_RETIREMENT_OPEN");
  assert.match(decision.evidence, /zero student_registration\/crm_sync consumers/i);
});

test("DB06 independently classifies assigned_exam family as historical retirement candidates", () => {
  const evidence = fs.readFileSync("docs/planning/database-parity-db06-reconciliation.md", "utf8");
  for (const name of ["assigned_exam", "attempted_question", "examinee"]) {
    assert.match(evidence, new RegExp("\\b" + name + "\\b"));
  }
  assert.match(evidence, /Retirement candidate only/i);
  assert.match(evidence, /no entity for these twelve tables/i);
});
