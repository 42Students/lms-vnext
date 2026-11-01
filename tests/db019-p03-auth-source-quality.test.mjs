import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { auditDb019P03 } from "../scripts/db019-p03-auth-source-quality.mjs";

const source=JSON.parse(fs.readFileSync("docs/planning/db-pass4-columns-db01_identity_and_tenancy.json","utf8"));
const ledger=JSON.parse(fs.readFileSync("docs/planning/db019-p03-auth-field-review.json","utf8"));
const clone=()=>structuredClone(ledger);
const find=(x,table,field)=>x.records.find(r=>r.legacyTable===table&&r.legacyColumn===field);

test("DB19-P03 exact frozen 79 source fields, no synthetic PG or credential parity",()=>{
  const result=auditDb019P03(source,ledger);
  assert.equal(result.valid,true,JSON.stringify(result.errors));
  assert.equal(result.sourceFields,79);
  assert.equal(result.individualSourceReviews,79);
  assert.equal(result.postgresVerified,0);
  assert.equal(result.consumerVerified,0);
  assert.equal(result.approvedRetirements,0);
  assert.equal(result.acceptanceReady,false);
  assert.equal(ledger.records.length,79);
});

test("P03 source census and exact original definitions cannot be forged",()=>{
  const missing=clone();missing.records.pop();
  assert.equal(auditDb019P03(source,missing).valid,false);
  const duplicate=clone();duplicate.records.push(structuredClone(duplicate.records[0]));
  assert.equal(auditDb019P03(source,duplicate).valid,false);
  const changed=clone();find(changed,"user","phone").sourceType="varchar(32)";
  assert.equal(auditDb019P03(source,changed).valid,false);
  const sha=clone();sha.frozenLegacyBackendSha="future-oracle";
  assert.equal(auditDb019P03(source,sha).valid,false);
});

test("P03 historical JWTs, refresh credentials and password cannot be live session credentials",()=>{
  for(const [table,field] of [
    ["auth_handoff_token","access_token"],["auth_handoff_token","refresh_token"],
    ["auth_handoff_token","token"],["auth_token","token"],
    ["login_user","password"],["user","password"],
    ["refresh_token_blocklist","jti"],["user_session","jti"],
  ]){
    const changed=clone();
    const decision=find(changed,table,field).reviewDecision;
    decision.targetRefs=["identity_device_sessions.credential_digest"];
    decision.disposition="SECURE_BEHAVIORAL_REDESIGN_CANDIDATE";
    const result=auditDb019P03(source,changed);
    assert.equal(result.valid,false,table+"."+field);
    assert.ok(result.errors.some(e=>e.code==="HISTORICAL_CREDENTIAL_MUST_NOT_REPLAY"));
  }
});

test("P03 OTP, verification email bearer and phone source must map only to keyed digest proposals",()=>{
  for(const [table,field] of [
    ["email_verification_token","token"],
    ["mobile_login_attempt","otp"],
    ["mobile_login_attempt","email_otp"],
    ["mobile_login_attempt","phone"],
  ]){
    const changed=clone();
    find(changed,table,field).reviewDecision.targetRefs=["users.email"];
    const result=auditDb019P03(source,changed);
    assert.equal(result.valid,false,table+"."+field);
    assert.ok(result.errors.some(e=>e.code==="SENSITIVE_CANDIDATE_NOT_KEYED"));
  }
});

test("P03 no source-only review can approve retirement, runtime, consumer or target without typed schema",()=>{
  for(const key of ["runtimeVerified","consumerVerified","retirementApproved"]){
    const changed=clone();changed.records[0].reviewDecision[key]=true;
    assert.equal(auditDb019P03(source,changed).valid,false,key);
  }
  const changed=clone();
  find(changed,"user","email").reviewDecision.targetRefs=["users.not_a_real_column"];
  assert.equal(auditDb019P03(source,changed).valid,false);
});
