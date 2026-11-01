#!/usr/bin/env node
// DB19-P03 pinned historical auth/session field dispositions.
// This is strictly SOURCE REVIEW: not legacy data migration, registration,
// credential replay, runtime semantic acceptance or permission approval.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const ORACLE="21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const expected={
  auth_handoff_token:9,auth_token:5,email_verification_token:7,login_user:6,
  mobile_login_attempt:18,refresh_token_blocklist:5,role:6,user:12,
  user_roles:2,user_session:9,
};
const schemaPaths={
  users:"src/db/schema/users.ts",
  identity_auth_attempts:"src/db/schema/identity-auth-attempts.ts",
  identity_email_verification_links:"src/db/schema/identity-auth-attempts.ts",
  identity_email_ownership_proofs:"src/db/schema/identity-auth-attempts.ts",
  identity_device_sessions:"src/db/schema/identity-device-sessions.ts",
  membership_roles:"src/db/schema/memberships.ts",
  college_memberships:"src/db/schema/memberships.ts",
};
const forceRetired=new Set([
  "auth_handoff_token.token","auth_handoff_token.access_token",
  "auth_handoff_token.refresh_token","auth_token.token",
  "login_user.password","user.password","refresh_token_blocklist.jti",
  "user_session.jti",
]);
const safeTarget={
  "email_verification_token.token":"identity_email_verification_links.token_digest",
  "mobile_login_attempt.otp":"identity_auth_attempts.sms_code_mac",
  "mobile_login_attempt.email_otp":"identity_auth_attempts.email_code_mac",
  "mobile_login_attempt.phone":"identity_auth_attempts.contact_fingerprint",
};

export function auditDb019P03(source,review,readSchema=(p)=>fs.readFileSync(path.join(ROOT,p),"utf8")){
  const errors=[];
  const fail=(code,key="")=>errors.push({code,key});
  if(!source?.tables || !Array.isArray(source.tables) || !review?.records || !Array.isArray(review.records))
    return {valid:false,errors:[{code:"INVALID_SOURCE_OR_REVIEW",key:""}],sourceOnly:true};
  if(source.sourceSha!==ORACLE || review.frozenLegacyBackendSha!==ORACLE)
    fail("FROZEN_ORACLE_CHANGED");
  const sourceRows=new Map();
  for(const t of source.tables.filter(t=>Object.hasOwn(expected,t.table))){
    if(t.rows?.length!==expected[t.table])fail("SOURCE_FAMILY_COUNT",t.table);
    for(const row of t.rows||[]){
      const key=t.table+"."+row.legacyColumn;
      if(sourceRows.has(key) || row.legacyTable!==t.table)fail("SOURCE_DUPLICATE_OR_MISOWNED",key);
      else sourceRows.set(key,row);
    }
  }
  if(Object.keys(expected).length!==source.tables.filter(t=>Object.hasOwn(expected,t.table)).length
    || sourceRows.size!==79 || review.sourceFields!==79 || review.reviewedFieldProposals!==79
    || review.runtimeVerifiedFields!==0 || review.approvedRetirements!==0)
    fail("P03_79_FIELD_CENSUS_DRIFT");
  const seen=new Set(),fileCache=new Map();
  let proposals=0,unmapped=0;
  for(const item of review.records){
    const key=item?.legacyTable+"."+item?.legacyColumn;
    const old=sourceRows.get(key),d=item?.reviewDecision;
    if(!old || seen.has(key) || item.sourceType!==old.sourceType
      || item.sourceDefinition!==old.sourceDefinition
      || item.sourceNullable!==old.nullable
      || item.sourceEvidence!==old.sourceEvidence){
      fail("UNREVIEWED_DUPLICATE_OR_SOURCE_SEMANTIC_DRIFT",key);continue;
    }
    seen.add(key);
    if(!d || d.legacyBackendSha!==ORACLE || d.sourceReviewed!==true
      || d.runtimeVerified!==false || d.consumerVerified!==false
      || d.retirementApproved!==false
      || d.acceptanceScope!=="SOURCE_ONLY_NOT_A_LIVE_HISTORIC_DATA_MIGRATION"
      || typeof d.sourceRationale!=="string" || d.sourceRationale.length<65
      || typeof d.outstandingProof!=="string" || d.outstandingProof.length<75
      || !Array.isArray(d.targetRefs) || d.targetRefs.length>1)
      {fail("UNSUPPORTED_ACCEPTANCE_OR_MISSING_RATIONALE",key);continue;}
    proposals++;
    if(!d.targetRefs.length){
      unmapped++;
      if(d.disposition!=="SOURCE_RETIREMENT_OR_UNMAPPED_REVIEW")
        fail("UNAPPROVED_RETIREMENT_DISPOSITION",key);
    } else {
      if(!["SECURE_BEHAVIORAL_REDESIGN_CANDIDATE","SCOPED_FIELD_TARGET_CANDIDATE"].includes(d.disposition))
        fail("INVALID_CANDIDATE_DISPOSITION",key);
    }
    if(forceRetired.has(key) && d.targetRefs.length)
      fail("HISTORICAL_CREDENTIAL_MUST_NOT_REPLAY",key);
    if(Object.hasOwn(safeTarget,key) && d.targetRefs[0]!==safeTarget[key])
      fail("SENSITIVE_CANDIDATE_NOT_KEYED",key);
    for(const ref of d.targetRefs){
      const parts=ref.split(".");
      if(parts.length!==2 || !schemaPaths[parts[0]] || !/^[a-z][a-z0-9_]*$/.test(parts[1])){
        fail("UNAPPROVED_TARGET_TABLE",key);continue;
      }
      const file=schemaPaths[parts[0]];
      if(!fileCache.has(file))fileCache.set(file,readSchema(file));
      const schema=fileCache.get(file);
      const table=new RegExp("pgTable\\(\\s*[\"']"+parts[0]+"[\"']");
      const column=new RegExp("\\b[a-zA-Z][a-zA-Z0-9]*\\([\"']"+parts[1]+"[\"']");
      if(!table.test(schema)||!column.test(schema))
        fail("TARGET_NOT_DECLARED_IN_REGISTERED_TYPED_SCHEMA",key);
    }
  }
  for(const key of sourceRows.keys())if(!seen.has(key))fail("MISSING_SOURCE_FIELD_REVIEW",key);
  return {valid:errors.length===0,errors,sourceOnly:true,acceptanceReady:false,
    sourceFields:sourceRows.size,individualSourceReviews:proposals,
    unapprovedOrUnmappedSourceFields:unmapped,postgresVerified:0,consumerVerified:0,
    approvedRetirements:0};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const source=JSON.parse(fs.readFileSync(path.join(ROOT,
    "docs/planning/db-pass4-columns-db01_identity_and_tenancy.json"),"utf8"));
  const review=JSON.parse(fs.readFileSync(path.join(ROOT,
    "docs/planning/db019-p03-auth-field-review.json"),"utf8"));
  const audit=auditDb019P03(source,review);
  console.log(JSON.stringify(audit,null,2));
  if(!audit.valid)process.exitCode=1;
}
