import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const load=path=>JSON.parse(readFileSync(path,"utf8"));
const evidence=load("docs/planning/db004-current-owner-evidence.json");
const register=load("docs/planning/db004-closure-decision-register.json");
const tracker=load("docs/tracker.json");
const fields=evidence.rows;
const sorted=items=>[...items].sort();

test("DB-004 finite closure register exactly covers remaining technical gaps",()=>{
 assert.equal(fields.length,195);
 const technical=fields.filter(x=>x.runtimeSemanticsVerified||x.retirementImplementationVerified||x.compositeImplementationVerified);
 const missing=fields.filter(x=>!x.runtimeSemanticsVerified&&!x.retirementImplementationVerified&&!x.compositeImplementationVerified);
 const physical=missing.filter(x=>x.physicalVerified);
 const composite=missing.filter(x=>x.evidenceStatus==="COMPOSITE_REDESIGN_SEMANTIC_REVIEW");
 const retirement=missing.filter(x=>!x.physicalVerified&&x.evidenceStatus!=="COMPOSITE_REDESIGN_SEMANTIC_REVIEW");
 assert.equal(evidence.summary.technicalEvidenceCoverage,technical.length);
 assert.equal(evidence.summary.technicalEvidenceUncovered,missing.length);
 assert.equal(register.technicalSnapshot.total,fields.length);
 assert.equal(register.technicalSnapshot.technicalCovered,technical.length);
 assert.equal(register.technicalSnapshot.uncovered,missing.length);
 assert.equal(register.technicalSnapshot.compositeImplemented,fields.filter(x=>x.compositeImplementationVerified).length);
 assert.deepEqual(sorted(register.uncoveredFieldClasses.physicalPending),sorted(physical.map(x=>x.legacyField)));
 assert.deepEqual(sorted(register.uncoveredFieldClasses.compositePending),sorted(composite.map(x=>x.legacyField)));
 assert.deepEqual(sorted(register.uncoveredFieldClasses.retirementOrSecurityPending),sorted(retirement.map(x=>x.legacyField)));
 assert.equal(new Set(Object.values(register.uncoveredFieldClasses).flat()).size,missing.length);
 assert.equal(register.technicalSnapshot.approvalPendingRetirements,
  fields.filter(x=>x.retirementImplementationVerified&&!x.retirementApproved).length);
 assert.equal(register.technicalSnapshot.retirementProductApproved,34);
 assert.equal(evidence.summary.retirementProductApproved,34);
 assert.equal(register.retirementPolicy.requesterApproved,34);
 assert.equal(register.retirementPolicy.finalSecurityOrRetentionSignoffPending,
  fields.filter(x=>x.retirementImplementationVerified&&!x.retirementApproved).length);
 const retired=fields.filter(x=>x.retirementImplementationVerified);
 assert.equal(retired.length,34);
 for(const row of retired){
  assert.equal(row.retirementProductDisposition?.status,"APPROVED_BY_REQUESTER");
  assert.equal(row.retirementProductDisposition?.recordedOn,"2026-10-28");
  const decision=register.decisions.find(x=>x.id===row.retirementProductDisposition?.policyDecisionId);
  assert.ok(decision,"Every deprecated field must trace to a selected policy decision");
  assert.equal(decision.productDecision.status,"APPROVED_BY_REQUESTER");
  assert.equal(row.retirementApproved,false,
   "Product approval alone cannot masquerade as external security/retention sign-off");
 }

});

test("no DB-004 release green without genuine owner decisions and complete technical evidence",()=>{
 assert.equal(register.task,"DB-004");
 assert.equal(register.decisions.length,7);
 assert.equal(new Set(register.decisions.map(x=>x.id)).size,7);
 for(const decision of register.decisions){
  assert.ok(decision.question&&decision.ownerRoles.length&&decision.options.length>=2);
  assert.ok(decision.requiredEvidence.length>=2);
  if(decision.approvalStatus==="APPROVED"){
   assert.ok(decision.options.includes(decision.selectedOption));
   assert.ok(decision.approvedBy&&decision.approvedAt&&decision.approvalEvidenceUrl);
  }else{
   assert.equal(decision.approvalStatus,"PENDING");
   assert.equal(decision.selectedOption,null);
   assert.equal(decision.approvedBy,null);
   assert.equal(decision.approvedAt,null);
   assert.equal(decision.approvalEvidenceUrl,null);
  }
 }
 assert.equal(register.productDisposition.count,7);
 assert.equal(register.productDisposition.legacyHistoricalImport,"NOT_APPLICABLE_NOT_AUTHORIZED");
 assert.equal(register.productDisposition.noProductionLegacyAccess,true);
 for(const decision of register.decisions){
  assert.equal(decision.productDecision.status,"APPROVED_BY_REQUESTER");
  assert.equal(decision.productDecision.recordedOn,"2026-10-28");
  assert.ok(decision.options.includes(decision.productDecision.selectedOption));
  assert.match(decision.productDecision.source,/Explicit user instruction/);
  // Requester's architectural approval is not an independent role attestation.
  // Keep real security/release owner acceptance a separate gate.
  if(decision.approvalStatus==="PENDING")assert.equal(decision.approvedBy,null);
 }
 const noImport=register.decisions.find(x=>x.id==="D03").productDecision;
 assert.equal(noImport.selectedOption,"NOT_APPLICABLE_GREENFIELD_NO_LEGACY_IMPORT");
 assert.match(noImport.rationale,/do not import old production/);
 const provider=register.decisions.find(x=>x.id==="D07").productDecision;
 assert.equal(provider.selectedOption,"REQUIRE_AUTHORIZED_PROVIDER_SMOKE_PLUS_REGISTERED_SCHEMA_AND_CI_NO_IMPORT");
 assert.match(provider.rationale,/Historical data import receipts are NOT APPLICABLE/);
 const done=tracker.tasks.find(x=>x.id==="DB-004")?.done;
 const hasAllEvidence=fields.every(x=>x.runtimeSemanticsVerified||x.compositeImplementationVerified||x.retirementApproved);
 const allDecisionsApproved=register.decisions.every(x=>x.approvalStatus==="APPROVED");
 if(done)assert.ok(hasAllEvidence&&allDecisionsApproved,
  "DB-004 is not DONE until every source has evidence and all owner decisions are recorded");
 if(!hasAllEvidence||!allDecisionsApproved)
  assert.equal(done,false,"DB-004 remains open until field and sign-off gates are met");
});
