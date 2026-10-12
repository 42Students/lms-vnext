import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const ledger=JSON.parse(fs.readFileSync(path.join(root,"docs/planning/db01-chat03-db09-recruiter-peer-review.json"),"utf8"));
const sql=fs.readFileSync(path.join(root,"docs/planning/sql/db09-recruiter-grant-lifecycle-candidate.sql"),"utf8");

test("all 30 DB004 recruiter handoff rows have explicit dispositions",()=>{
  assert.equal(ledger.rows.length,30);
  assert.equal(ledger.counts.reviewed,30);
  assert.equal(ledger.counts.explicitDisposition,30);
  assert.equal(ledger.counts.unresolved,0);
  assert.equal(ledger.counts.runtimeVerified,0);
});

test("live recruiter grant semantics have staged targets",()=>{
  const keys=[
    "recruiter_college_access.valid_until",
    "recruiter_college_access.granted_at",
    "recruiter_college_access.revoke_reason",
    "recruiter_college_access.version",
    "recruiter_college_access.verification",
    "recruiter_college_access.pending_recruiter_lead_id",
    "recruiter_college_access_capability.capability",
  ];
  for(const key of keys){
    const row=ledger.rows.find(x=>x.legacyField===key);
    assert.ok(row,key);
    assert.notEqual(row.proposedTarget,null,key);
  }
});

test("staged grant status and capability vocabulary use recruiter-era codes",()=>{
  assert.match(sql,/PENDING_RECRUITER/);
  assert.doesNotMatch(sql,/PENDING_HR/);
  for(const cap of ["COLLEGE_OVERVIEW","DRIVE_REQUEST","DRIVE_WORK"]){
    assert.match(sql,new RegExp("'" + cap + "'"));
  }
});

test("grant lifecycle preserves expiry, verification, CAS and history",()=>{
  assert.match(sql,/valid_until timestamptz/);
  assert.match(sql,/verification varchar/);
  assert.match(sql,/version integer/);
  assert.match(sql,/placement_recruiter_grant_events/);
  assert.match(sql,/next_version = prior_version \+ 1/);
});

test("grant history does not use free-form actor type as authorization state",()=>{
  for(const key of [
    "recruiter.created_by_user_type",
    "recruiter_college_access.granted_by_user_type",
    "recruiter_college_access.revoked_by_user_type",
  ]){
    const row=ledger.rows.find(x=>x.legacyField===key);
    assert.equal(row.disposition,"REDESIGNED_ACTOR_PROVENANCE",key);
    assert.match(row.proposedTarget,/actor_role_snapshot|canonical user roles/);
  }
});
