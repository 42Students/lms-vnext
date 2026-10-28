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
 assert.equal(physical.length,112);
 assert.ok(physical.every(x=>x.evidenceStatus==="EXACT_REGISTERED_FIELD_PG_WITNESS"));
 assert.ok(current.rows.every(x=>x.runtimeSemanticsVerified===false));
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
 assert.equal(current.rows.filter(x=>x.evidenceStatus==="REGISTERED_IDENTITY_NAME_ADDITIVE_PARTIAL_RUNTIME").length,6);
 assert.equal(current.rows.filter(x=>x.evidenceStatus==="REGISTERED_BRANDING_REPLACEMENT_SEMANTIC_REVIEW").length,15);
});
