import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {reconcileDb01Triage, gitBlobSha, INVENTORY_PATH, TRIAGE_PATH} from "../scripts/db19-db01-triage-crosscheck.mjs";

const primaryBuffer=readFileSync(resolve(INVENTORY_PATH));
const primary=JSON.parse(primaryBuffer.toString("utf8"));
const triage=JSON.parse(readFileSync(resolve(TRIAGE_PATH),"utf8"));
const sha=gitBlobSha(primaryBuffer);
const clone=v=>structuredClone(v);
const verify=(a=primary,b=triage,hash=sha)=>reconcileDb01Triage(a,b,{inventoryBlobSha:hash});
const assertError=(report,code)=>assert.ok(report.errors.some(e=>e.code===code),code);

test("DB01 triage is pinned to exactly this preserved historical inventory blob",()=>{
  assert.equal(sha,triage.sourceInventory.blobSha);
  assert.equal(primary.sourceSha,triage.sourceInventory.legacyBackendSha);
});
test("all 312 legacy DB01 field dispositions have a corresponding source row",()=>{
  const r=verify();assert.equal(r.valid,true,JSON.stringify(r.errors.slice(0,5)));
  assert.equal(r.summary.inventoryFields,312);
  assert.equal(r.summary.reviewedFields,312);
  assert.equal(r.summary.runtimeVerified,0);
});
test("active/exception counts distinguish source triage from live DB parity",()=>{
  const r=verify();
  assert.equal(r.summary.sourceActiveFields,289);
  assert.equal(r.summary.sourceExceptionFields,23);
  assert.equal(r.summary.targetCandidatesUnverified,116);
  assert.equal(r.summary.withoutTargetDecision,196);
});
test("70 active fields lack source-path/summary evidence; do not count them as proven consumers",()=>{
  const r=verify();
  assert.equal(r.summary.activeFieldsWithEvidence,219);
  assert.equal(r.summary.activeFieldsNeedingConsumerProof,70);
  assert.equal(r.verification,"FROZEN_SOURCE_ACTIVITY_REVIEW_ONLY_NOT_RUNTIME_VERIFIED");
});
test("the original field-map ledger is intentionally NOT mutated by this overlay",()=>{
  assert.ok(primary.tables.every(t=>t.rows.every(r=>r.verifiedMapping===null&&r.validationEvidence===null)));
});
test("wrong pinned source blob fails closed",()=>{
  assertError(verify(primary,triage,"0".repeat(40)),"PINNED_INVENTORY_BLOB_DRIFT");
});
test("omitting a source blob SHA fails closed instead of disabling provenance",()=>{
  assertError(reconcileDb01Triage(primary,triage),"PINNED_INVENTORY_BLOB_DRIFT");
});
test("wrong oracle SHA fails closed",()=>{
  const t=clone(triage);t.sourceInventory.legacyBackendSha="f".repeat(40);
  assertError(verify(primary,t),"LEGACY_ORACLE_DRIFT");
});
test("dropping a legacy field fails closed",()=>{
  const t=clone(triage);t.rows.pop();
  assertError(verify(primary,t),"INVENTORY_CARDINALITY_DRIFT");
});
test("duplicating an identity field fails closed",()=>{
  const t=clone(triage);t.rows[1]=clone(t.rows[0]);
  assertError(verify(primary,t),"DUPLICATE_TRIAGE");
});
test("claiming a different source type fails closed",()=>{
  const t=clone(triage);t.rows[0].sourceType="varchar(900)";
  assertError(verify(primary,t),"SOURCE_SHAPE_DRIFT");
});
test("claiming a different source nullable disposition fails closed",()=>{
  const t=clone(triage);t.rows[0].sourceNullable="NULL";
  assertError(verify(primary,t),"SOURCE_SHAPE_DRIFT");
});
test("claiming a different set of source risk flags fails closed",()=>{
  const t=clone(triage);t.rows[0].sourceRiskFlags.push("FORGED");
  assertError(verify(primary,t),"SOURCE_SHAPE_DRIFT");
});
test("erasing a current workflow classification fails closed",()=>{
  const t=clone(triage);t.rows[0].postV150Active="";
  assertError(verify(primary,t),"UNSUPPORTED_SOURCE_CLASSIFICATION");
});
test("erasing a category fails closed",()=>{
  const t=clone(triage);t.rows[0].category="";
  assertError(verify(primary,t),"UNSUPPORTED_SOURCE_CLASSIFICATION");
});
test("approved runtime evidence cannot be inferred from source triage",()=>{
  const t=clone(triage);t.rows[0].verificationEvidence={kind:"DISPOSABLE_POSTGRES"};
  assertError(verify(primary,t),"FALSE_RUNTIME_ACCEPTANCE");
});
test("a fabricated verifiedMapping in the legacy ledger is forbidden",()=>{
  const a=clone(primary);a.tables[0].rows[0].verifiedMapping="users.id";
  assertError(verify(a,triage),"FALSE_RUNTIME_ACCEPTANCE");
});
test("malformed proposed target paths fail closed",()=>{
  const t=clone(triage);const i=t.rows.findIndex(r=>r.candidateTarget!=null);
  assert.ok(i>=0);t.rows[i].candidateTarget=" ";
  assertError(verify(primary,t),"INVALID_TARGET_CANDIDATE");
});
test("changing source-only status to verified fails closed",()=>{
  const t=clone(triage);t.rows[0].reviewStatus="DB_TESTED";
  assertError(verify(primary,t),"UNSUPPORTED_SOURCE_CLASSIFICATION");
});
