import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
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
 assert.equal(physical.length,137);
 assert.equal(physical.filter(x=>x.evidenceStatus==="EXACT_REGISTERED_FIELD_PG_WITNESS").length,112);
 assert.equal(physical.filter(x=>x.evidenceStatus==="REGISTERED_BRANDING_REPLACEMENT_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,15);
 assert.equal(physical.filter(x=>x.evidenceStatus==="REGISTERED_IDENTITY_NAME_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,6);
 assert.equal(physical.filter(x=>x.evidenceStatus==="REGISTERED_DNS_DIAGNOSTICS_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,1);
 assert.equal(physical.filter(x=>x.evidenceStatus==="REGISTERED_COLLEGE_LEADERSHIP_REPLACEMENT_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,2);
 assert.equal(physical.filter(x=>x.evidenceStatus==="REGISTERED_RECRUITER_SUSPENSION_PHYSICAL_WITNESS_SEMANTIC_REVIEW").length,1);
 assert.equal(current.summary.registeredReplacementPhysicalWitnesses,25);
 assert.equal(current.summary.registeredPhysicalWitnessTotal,137);
 assert.equal(current.summary.stillWithoutPhysicalWitness,58);
 const verified=current.rows.filter(x=>x.runtimeSemanticsVerified);
 assert.equal(verified.length,134);
 assert.equal(current.summary.runtimeSemanticsVerified,134);
 assert.equal(current.summary.runtimeSemanticsUnverified,61);
 const allowed={
  "college_branding.":["tests/integration/chat11-super-admin-branding-cas.test.ts",15],
  "tenant_domain.":["tests/integration/tenant-domains.test.ts",13],
  "mobile_login_attempt.":["tests/integration/db01-auth-attempt-field-semantics.test.ts",17],
  "user_session.":["tests/integration/db01-device-session-field-semantics.test.ts",8],
  "refresh_token_blocklist.":["tests/integration/db01-device-session-field-semantics.test.ts",4],
  "user.":["tests/integration/db01-user-identity-field-semantics.test.ts",8],
  "college.":["tests/integration/db01-org-college-field-semantics.test.ts",15],
  "organization.":["tests/integration/db01-org-college-field-semantics.test.ts",5],
  "learner.":["tests/integration/db01-learner-faculty-field-semantics.test.ts",8],
  "faculty.":["tests/integration/db01-learner-faculty-field-semantics.test.ts",8],
  "department.":["tests/integration/db01-department-field-semantics.test.ts",6],
  "recruiter.":["tests/integration/db01-recruiter-identity-field-semantics.test.ts",6],
  "role.":["tests/integration/db01-learner-faculty-field-semantics.test.ts",1],
  "learner_acct_verification.":["tests/integration/db01-learner-faculty-otp-field-compat.test.ts",9],
  "faculty_acct_verification.":["tests/integration/db01-learner-faculty-otp-field-compat.test.ts",9],
 };
 for(const [prefix,[suite,count]] of Object.entries(allowed)){
  const group=verified.filter(row=>row.legacyField.startsWith(prefix)&&
    !(prefix==="college."&&["college.college_chair_id","college.college_vice_chair_id"].includes(row.legacyField)));
  assert.equal(group.length,count,prefix);
  assert.ok(group.every(row=>row.physicalVerified&&row.runtimeEvidence?.suite===suite));
  assert.ok(group.every(row=>row.runtimeEvidence?.passingRun?.startsWith("https://github.com/42Students/lms-vnext/actions/runs/")));
  assert.ok(group.every(row=>row.runtimeEvidence?.testedCommit?.length===40));
  assert.ok(group.every(row=>row.runtimeEvidence?.limitations?.length>0));
  assert.ok(group.every(row=>existsSync(row.runtimeEvidence.suite)));
 }
 const leadership=verified.filter(x=>["college.college_chair_id","college.college_vice_chair_id"].includes(x.legacyField));
 assert.equal(leadership.length,2);
 assert.ok(leadership.every(x=>x.physicalVerified&&
  x.runtimeEvidence?.suite==="tests/integration/db01-college-leadership-field-semantics.test.ts"));
 assert.ok(current.rows.filter(x=>x.legacyField==="college_branding.is_deleted").every(x=>x.runtimeSemanticsVerified));
 assert.ok(current.rows.filter(x=>!Object.keys(allowed).some(prefix=>x.legacyField.startsWith(prefix))).every(x=>!x.runtimeSemanticsVerified));
 assert.ok(current.rows.filter(x=>x.runtimeSemanticsVerified).every(x=>x.physicalVerified));
 assert.ok(current.rows.filter(x=>x.legacyField.startsWith("auth_handoff_token.")||x.legacyField.startsWith("login_user.")).every(x=>!x.runtimeSemanticsVerified));

 const composites=current.rows.filter(row=>row.compositeImplementationVerified);
 assert.equal(composites.length,17);
 assert.deepEqual(new Set(composites.map(row=>row.legacyField)),new Set(["faculty.id","faculty.created_at","faculty.is_deleted","faculty.updated_at","learner.id","learner.created_at","learner.is_deleted","learner.updated_at","recruiter.id","role.name","faculty.organization_id","learner.organization_id","user.user_type","user_roles.user_id","user_roles.role_id","faculty_acct_verification.blocked_till_ts","learner_acct_verification.blocked_till_ts"]));
 const expectedCompositeSuiteByField={
  ...Object.fromEntries(["faculty.organization_id","learner.organization_id",
   "user.user_type","user_roles.user_id","user_roles.role_id"].map(field=>
   [field,"tests/integration/db01-composite-role-field-semantics.test.ts"])),
  ...Object.fromEntries(["faculty.id","faculty.created_at","faculty.is_deleted",
   "faculty.updated_at","learner.id","learner.created_at","learner.is_deleted",
   "learner.updated_at"].map(field=>
   [field,"tests/integration/db01-source-account-provenance-field-semantics.test.ts"])),
  "recruiter.id":"tests/integration/db01-recruiter-identity-field-semantics.test.ts",
  "role.name":"tests/integration/db01-role-definition-field-semantics.test.ts",
  "faculty_acct_verification.blocked_till_ts":"tests/integration/db01-learner-faculty-otp-field-compat.test.ts",
  "learner_acct_verification.blocked_till_ts":"tests/integration/db01-learner-faculty-otp-field-compat.test.ts",
 };
 assert.ok(composites.every(row=>!row.physicalVerified&&!row.runtimeSemanticsVerified&&
  row.compositeEvidence?.suite===expectedCompositeSuiteByField[row.legacyField]&&
  row.compositeEvidence?.passingRun?.startsWith("https://github.com/42Students/lms-vnext/actions/runs/")&&
  row.compositeEvidence?.testedCommit?.length===40&&
  row.compositeEvidence?.limitations?.length>0));
 assert.equal(current.summary.compositeImplementationVerified,17);
 assert.ok(composites.every(row=>
  row.compositeEvidence?.suite&&existsSync(row.compositeEvidence.suite)&&
  row.compositeEvidence?.passingRun?.startsWith("https://github.com/42Students/lms-vnext/actions/runs/")&&
  row.compositeEvidence?.testedCommit?.length===40&&
  row.compositeEvidence?.limitations?.length>0));
 const technicallyRetired=current.rows.filter(row=>row.retirementImplementationVerified);
 const retirementCandidates=current.rows.filter(row=>
  ["auth_handoff_token.","auth_token.","login_user."].some(p=>row.legacyField.startsWith(p))||
  row.legacyField==="user.password" || ["faculty.token_version","learner.token_version","recruiter.token_version","user.user_name","role.id","role.is_deleted","role.updated_at","role.description","refresh_token_blocklist.user_type","user_session.user_type","mobile_login_attempt.updated_at","faculty_acct_verification.updated_at","learner_acct_verification.updated_at"].includes(row.legacyField));
 assert.equal(technicallyRetired.length,34);
 assert.deepEqual(new Set(technicallyRetired.map(x=>x.legacyField)),
  new Set(retirementCandidates.map(x=>x.legacyField)));
 assert.equal(current.summary.retirementImplementationVerified,34);
 assert.equal(current.summary.retirementApprovalPending,34);
 assert.equal(current.summary.technicalEvidenceCoverage,185);
 assert.equal(current.summary.technicalEvidenceUncovered,10);
 assert.ok(technicallyRetired.every(x=>x.retirementApproved===false &&
  x.runtimeSemanticsVerified===false &&
  x.physicalVerified===false &&
  x.retirementEvidence?.witness==="tests/integration/db01-credential-retirement-absence.test.ts" &&
  x.retirementEvidence?.testedCommit?.length===40));
 assert.ok(current.rows.filter(x=>!x.retirementImplementationVerified)
  .every(x=>x.retirementApproved!==true));
 assert.ok(["learner_acct_verification.learner_id",
  "learner_acct_verification.roll_number",
  "faculty_acct_verification.faculty_id"].every(field=>
   current.rows.find(row=>row.legacyField===field)?.runtimeSemanticsVerified===false));
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
