import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inspectDb004, SOURCE_ONLY_PASS } from "../scripts/db004-identity-disposition-audit.mjs";

const root = resolve(import.meta.dirname, "..");
const source = JSON.parse(readFileSync(resolve(root, "docs/planning/db01-chat02-312-field-source-triage.json")));
const ledger = JSON.parse(readFileSync(resolve(root, "docs/planning/db004-312-source-target-disposition-proposals.json")));
const edited = fn => { const clone = structuredClone(ledger); fn(clone); return inspectDb004(source, clone); };
const mutate = (id, fn) => edited(doc => { const r = doc.rows.find(x => x.legacyField === id); assert.ok(r, id); fn(r); });

test("all 312 original identity source fields have a distinct disposition", () => {
  const r = inspectDb004(source, ledger);
  assert.equal(r.passed, true, r.issues.join("; "));
  assert.equal(r.status, SOURCE_ONLY_PASS);
  assert.equal(r.totals.legacyFields, 312);
  assert.equal(r.totals.fieldDispositions, 312);
});

test("original 137 gaps are distinguished from 123 explicit target proposals and 14 non-persistence decisions", () => {
  const r = inspectDb004(source, ledger);
  assert.deepEqual([r.totals.priorNoTarget, r.totals.newUnverifiedProposals, r.totals.noPersistedTargetDecision],[137,123,14]);
});

test("source-only success never masquerades as PostgreSQL or release verification", () => {
  const r = inspectDb004(source, ledger);
  assert.equal(r.postgresExecuted, false);
  assert.equal(r.databasePhaseCertified, false);
  assert.equal(r.totals.liveRuntimeVerified, 0);
  assert.equal(r.totals.approvedRetirement, 0);
});

test("duplicate disposition is rejected", () => {
  assert.equal(edited(x => x.rows[0] = structuredClone(x.rows[1])).passed, false);
});

test("missing legacy source row is rejected", () => {
  assert.equal(edited(x => x.rows.pop()).passed, false);
});

test("invented field is rejected", () => {
  assert.equal(edited(x => x.rows[0].legacyField = "user.made_up_field").passed, false);
});

test("altering frozen legacy source type or activeness is rejected", () => {
  assert.equal(mutate("user.id", x => x.sourceType = "uuid").passed, false);
  assert.equal(mutate("user.id", x => x.sourceStatus = "RETIRED").passed, false);
});

test("no field may claim a real execution/retirement based on this source-only ledger", () => {
  assert.equal(mutate("user.id", x => x.liveRuntimeVerified = true).passed, false);
  assert.equal(mutate("login_user.password", x => x.approvedRetirement = true).passed, false);
});

test("password and raw handoff credentials cannot acquire a Postgres destination", () => {
  for (const id of ["user.password","login_user.password","auth_handoff_token.access_token","auth_handoff_token.refresh_token"]) {
    assert.equal(mutate(id, x => x.proposedTarget = "users.password").passed, false, id);
  }
});

test("revocation intent survives learner faculty and recruiter normalization", () => {
  for (const id of ["faculty.token_version","learner.token_version","recruiter.token_version"]) {
    assert.equal(mutate(id, x => x.proposedTarget = "users.updated_at").passed, false, id);
  }
});

test("cross-domain fields retain explicit task ownership", () => {
  assert.equal(mutate("faculty.address", x => x.ownerTask = "DB-999").passed, false);
  assert.equal(mutate("recruiter_college_access.valid_until", x => x.ownerTask = "").passed, false);
});

test("a null target without a disposition decision is rejected", () => {
  assert.equal(mutate("user.password", x => x.proposalRule = "MATCHED").passed, false);
});
