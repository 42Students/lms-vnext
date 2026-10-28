import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load=p=>JSON.parse(readFileSync(p,"utf8"));
const historical=load("docs/planning/db01-chat05-final-field-disposition.json");
const current=load("docs/planning/db004-current-owner-evidence.json");
test("DB-004 owner scope accounts for all legacy columns without stealing other domains",()=>{
 const own=historical.rows.filter(x=>x.ownerTask==="DB-004");
 assert.equal(own.length,195);
 assert.equal(current.rows.length,own.length);
 assert.deepEqual(new Set(current.rows.map(x=>x.legacyField)),
   new Set(own.map(x=>x.legacyField)));
 for(const row of current.rows){
  const prior=own.find(x=>x.legacyField===row.legacyField);
  assert.ok(prior);
  assert.equal(row.originalDisposition,prior.decisionStatus);
  assert.equal(row.historicalTarget,prior.target);
  assert.ok(row.evidence.length>0);
 }
});
test("physical field proof and runtime proof remain explicitly distinct",()=>{
 const physical=current.rows.filter(x=>x.physicalVerified);
 assert.equal(physical.length,134);
 assert.equal(physical.filter(x=>x.evidenceStatus==="EXACT_REGISTERED_FIELD_PG_WITNESS").length,112);
 assert.equal(physical.filter(x=>x.evidenceStatus==="REGISTERED_BRANDING_REPLACEMENT_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,15);
 assert.equal(physical.filter(x=>x.evidenceStatus==="REGISTERED_IDENTITY_NAME_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,6);
 assert.equal(physical.filter(x=>x.evidenceStatus==="REGISTERED_DNS_DIAGNOSTICS_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,1);
 assert.equal(current.summary.registeredPhysicalWitnessTotal,134);
 assert.equal(current.summary.stillWithoutPhysicalWitness,61);
 const verified=current.rows.filter(x=>x.runtimeSemanticsVerified);
 assert.equal(verified.length,14);
 assert.equal(current.summary.runtimeSemanticsVerified,14);
 assert.equal(current.summary.runtimeSemanticsUnverified,181);
 assert.ok(verified.every(x=>x.legacyField.startsWith("college_branding.") && x.physicalVerified));
 assert.ok(verified.every(x=>x.runtimeEvidence?.suite==="tests/integration/chat11-super-admin-branding-cas.test.ts"));
 assert.ok(current.rows.filter(x=>x.legacyField==="college_branding.is_deleted").every(x=>!x.runtimeSemanticsVerified));
 assert.ok(current.rows.filter(x=>!x.legacyField.startsWith("college_branding.")).every(x=>!x.runtimeSemanticsVerified));
 assert.equal(current.completion,"OPEN_UNTIL_RUNTIME_SEMANTICS_AND_SIGNOFF");
});
test("first-party OTP authority and retired credential handoff are not confused",()=>{
 const doc=readFileSync("docs/architecture/first-party-login.md","utf8");
 assert.match(doc,/supersedes the Identity/);
 const old=current.rows.filter(x=>x.evidenceStatus==="RETIRED_CROSS_HOST_HANDOFF_SOURCE_DECISION");
 assert.equal(old.length,6);
 const route=readFileSync("src/app/auth/handoff/page.tsx","utf8");
 assert.match(route,/handoff-retired/);
});
test("identity names and branding proposals now point to registered active modules",()=>{
 const schema=readFileSync("src/db/schema/users.ts","utf8");
 const branding=readFileSync("src/db/schema/college-branding.ts","utf8");
 assert.match(schema,/identityProfileVersion/);
 assert.match(branding,/collegeBranding = pgTable/);
 assert.equal(current.rows.filter(x=>x.evidenceStatus==="REGISTERED_IDENTITY_NAME_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,6);
 assert.equal(current.rows.filter(x=>x.evidenceStatus==="REGISTERED_BRANDING_REPLACEMENT_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,15);
});
