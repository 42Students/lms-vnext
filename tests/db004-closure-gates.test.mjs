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
 const done=tracker.tasks.find(x=>x.id==="DB-004")?.done;
 const hasAllEvidence=fields.every(x=>x.runtimeSemanticsVerified||x.compositeImplementationVerified||x.retirementApproved);
 const allDecisionsApproved=register.decisions.every(x=>x.approvalStatus==="APPROVED");
 if(done)assert.ok(hasAllEvidence&&allDecisionsApproved,
  "DB-004 is not DONE until every source has evidence and all owner decisions are recorded");
 if(!hasAllEvidence||!allDecisionsApproved)
  assert.equal(done,false,"DB-004 remains open until field and sign-off gates are met");
});
