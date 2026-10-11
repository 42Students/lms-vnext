import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {reconcileDb01Triage, reconcileDb01ProposalCoverage, gitBlobSha, INVENTORY_PATH, TRIAGE_PATH} from "../scripts/db19-db01-triage-crosscheck.mjs";

const primaryBuffer=readFileSync(resolve(INVENTORY_PATH));
const primary=JSON.parse(primaryBuffer.toString("utf8"));
const triage=JSON.parse(readFileSync(resolve(TRIAGE_PATH),"utf8"));
const sha=gitBlobSha(primaryBuffer);
const auth78=JSON.parse(readFileSync(resolve("docs/planning/db01-chat02-auth-78-field-proposal-crosswalk.json"),"utf8"));
const remaining150=JSON.parse(readFileSync(resolve("docs/planning/db01-chat02-remaining-150-review-queue.json"),"utf8"));
const queueSha=gitBlobSha(readFileSync(resolve("docs/planning/db01-chat02-no-target-disposition-queue.json")));
const proposalAudit=(a=auth78,b=remaining150,hash=queueSha,t=triage)=>
  reconcileDb01ProposalCoverage(t,a,b,{authNoTargetQueueBlobSha:hash});
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

test("all 228 supplemental DB01 rows agree with frozen 312-field triage",()=>{
  const r=proposalAudit();assert.equal(r.valid,true,JSON.stringify(r.errors.slice(0,5)));
  assert.equal(r.summary.authProposals,78);
  assert.equal(r.summary.remainingReviewRows,150);
  assert.equal(r.summary.uniqueSupplementRows,228);
  assert.equal(r.summary.runtimeAcceptedMappings,0);
});
test("DB01 proposal union exposes 175 candidates and 137 pending targets, no false parity",()=>{
  const r=proposalAudit();assert.equal(r.summary.priorTriageTargetCandidates,116);
  assert.equal(r.summary.supplementalTargetCandidates,59);
  assert.equal(r.summary.unionTargetCandidates,175);
  assert.equal(r.summary.withoutTargetCandidate,137);
  assert.equal(r.summary.coveragePercent,56.09);
});
test("unauthorized missing auth queue hash is rejected",()=>{
  assertError(proposalAudit(auth78,remaining150,null),"AUTH78_SOURCE_QUEUE_BLOB_DRIFT");
});
test("changed auth queue hash is rejected",()=>{
  assertError(proposalAudit(auth78,remaining150,"e".repeat(40)),"AUTH78_SOURCE_QUEUE_BLOB_DRIFT");
});
test("supplement row cannot claim a source field that does not exist",()=>{
  const a=clone(auth78);a.rows[0].sourceField="ghost.fake";
  assertError(proposalAudit(a),"UNKNOWN_PROPOSAL_FIELD");
});
test("duplicate supplement rows fail closed",()=>{
  const a=clone(auth78);a.rows[1]=clone(a.rows[0]);
  assertError(proposalAudit(a),"DUPLICATE_PROPOSAL");
});
test("same key in auth and remaining crosswalks is rejected",()=>{
  const b=clone(remaining150);b.rows[0].legacy=auth78.rows[0].sourceField;
  assertError(proposalAudit(auth78,b),"DUPLICATE_PROPOSAL");
});
test("contradictory target to frozen DB01 source triage is rejected",()=>{
  const t=clone(triage),a=clone(auth78);
  const k=a.rows.find(x=>x.candidateTarget!=null);
  t.rows.find(x=>x.legacyTable+"."+x.legacyColumn===k.sourceField).candidateTarget="forged.table";
  assertError(proposalAudit(a,remaining150,queueSha,t),"CONTRADICTING_FROZEN_TARGET");
});
test("remaining 150 source type mismatches fail closed",()=>{
  const b=clone(remaining150);b.rows[0].sourceType="varchar(999)";
  assertError(proposalAudit(auth78,b),"PROPOSAL_SOURCE_SHAPE_DRIFT");
});
test("forged PostgreSQL acceptance in 78-row supplemental ledger fails closed",()=>{
  const a=clone(auth78);a.rows[0].postgresVerified=true;
  assertError(proposalAudit(a),"FALSE_AUTH78_ACCEPTANCE");
});
test("forged runtime acceptance in 150-row source review fails closed",()=>{
  const b=clone(remaining150);b.rows[0].runtimeVerified=true;
  assertError(proposalAudit(auth78,b),"FALSE_REMAINING150_ACCEPTANCE");
});
test("missing 150-row source evidence fails closed",()=>{
  const b=clone(remaining150);b.rows.pop();
  assertError(proposalAudit(auth78,b),"SOURCE_PROPOSAL_CARDINALITY_DRIFT");
});
test("invalid source-only candidate string fails closed",()=>{
  const a=clone(auth78);a.rows.find(r=>r.candidateTarget!=null).candidateTarget=" ";
  assertError(proposalAudit(a),"INVALID_PROPOSAL_TARGET");
});
