import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest=JSON.parse(fs.readFileSync("docs/planning/db017-staged-integration-manifest.json","utf8"));
const journal=JSON.parse(fs.readFileSync("drizzle/meta/_journal.json","utf8"));
const s43=JSON.parse(fs.readFileSync("drizzle/meta/0043_snapshot.json","utf8"));
const s44=JSON.parse(fs.readFileSync("drizzle/meta/0044_snapshot.json","utf8"));
const m44=fs.readFileSync("drizzle/0044_db09_policy_crm_structural.sql","utf8");

test("DB017 manifest covers every DB00-DB10 domain exactly once",()=>{
  const names=manifest.domains.map((row)=>row.domain);
  assert.equal(names.length,11);
  assert.deepEqual(names,[...new Set(names)]);
  assert.deepEqual(names,[..."0123456789".split("").map((n)=>"DB0"+n),"DB10"]);
});

test("DB017 registered baseline links verified 0043 and current 0044",()=>{
  assert.equal(manifest.registeredJournalBaseline.verifiedThrough,"0043_db09_share_column_defaults");
  assert.equal(manifest.registeredJournalBaseline.currentStructuralRegistration,"0044_db09_policy_crm_structural");
  assert.equal(
    journal.entries.filter((row)=>row.tag==="0044_db09_policy_crm_structural").length,
    1,
  );
  assert.equal(journal.entries.find((row)=>row.tag==="0044_db09_policy_crm_structural")?.idx,44);
});

test("DB017 0044 snapshot adds exactly five DB09 canonical tables",()=>{
  const before=new Set(Object.values(s43.tables).map((t)=>t.name));
  const after=new Set(Object.values(s44.tables).map((t)=>t.name));
  const added=[...after].filter((name)=>!before.has(name)).sort();
  assert.deepEqual(added,[
    "placement_college_rules",
    "placement_company_visibility_settings",
    "placement_tpo_followups",
    "placement_tpo_lead_activities",
    "placement_tpo_leads",
  ]);
  assert.equal(before.size,90);
  assert.equal(after.size,95);
});

test("DB017 structural 0044 does not falsely promote DB09 trigger staging",()=>{
  assert.doesNotMatch(m44,/CREATE FUNCTION db09_/);
  assert.doesNotMatch(m44,/CREATE TRIGGER db09_/);
  const db09=manifest.domains.find((row)=>row.domain==="DB09");
  assert.ok(db09);
  assert.equal(db09.state,"STRUCTURAL_PARTIAL_REGISTERED");
  assert.ok(db09.deferred.some((x)=>x.includes("db09-tpo-crm-premerge")));
  assert.ok(db09.deferred.some((x)=>x.includes("collaboration")));
});

test("DB017 excludes known superseded/reference-only migration sources",()=>{
  for(const file of [
    "docs/planning/sql/db04-education-media-candidate.sql",
    "docs/planning/sql/db04-private-receipt-hardening-candidate.sql",
    "docs/planning/sql/db09-crm-scoped-fk-candidate.sql",
    "docs/planning/sql/db09-crm-tenant-fk-candidate.sql",
    "docs/planning/sql/db09-scheduling-premerge.sql",
    "docs/planning/sql/db09-notification-intents-candidate.sql",
    "docs/planning/sql/db09-company-export-preference-candidate.sql",
  ]) assert.ok(manifest.explicitExclusions.includes(file),file);
});

test("DB017 never interprets source completion as automatic migration readiness",()=>{
  for(const domain of manifest.domains){
    assert.ok(domain.decision);
    assert.ok(Array.isArray(domain.dependsOn));
    assert.ok(Array.isArray(domain.registered));
    assert.ok(Array.isArray(domain.deferred));
  }
  assert.ok(manifest.safetyRules.some((x)=>/Never auto-promote/i.test(x)));
  assert.ok(manifest.safetyRules.some((x)=>/Do not mark DATABASE phase ready/i.test(x)));
  assert.match(manifest.registeredJournalBaseline.currentStructuralReplay,/PENDING/);
});
