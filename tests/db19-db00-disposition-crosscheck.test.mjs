import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { reconcileDb00, reconcileCheckout } from '../scripts/db19-db00-disposition-crosscheck.mjs';
const sha='a'.repeat(40);
const row=(name,i,status)=>({legacyTable:name,legacyColumn:'col_'+i,reviewStatus:status});
const source=()=>({domain:'DB00_HISTORICAL_AND_ENGINE',sourceSha:sha,
  counts:{tables:3,fields:5},tables:[
    {table:'backup',sourceTableClass:'HISTORICAL_BACKUP_VALIDATE_RETIREMENT',rows:[row('backup',1,'CLASSIFY_HISTORIC_RETIREMENT'),row('backup',2,'CLASSIFY_HISTORIC_RETIREMENT')]},
    {table:'flyway_schema_history',sourceTableClass:'SCHEMA_TOOL_METADATA',rows:[row('flyway_schema_history',1,'UNVERIFIED_FIELD_SEMANTICS')]},
    {table:'smrithi_application',sourceTableClass:'LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION',rows:[row('smrithi_application',1,'UNVERIFIED_FIELD_SEMANTICS'),row('smrithi_application',2,'UNVERIFIED_FIELD_SEMANTICS')]},
  ]});
const review=()=>({domain:'DB00_HISTORICAL_AND_ENGINE',legacyOracleSha:sha,counts:{candidateTables:3,candidateFields:5,tableDispositionsClosed:2,fieldCandidatesDispositionedByTableDecision:3,pendingProductDecisionTables:1,pendingProductDecisionFields:2},tables:[
  {table:'backup',sourceClass:'HISTORICAL_BACKUP_VALIDATE_RETIREMENT',sourceFieldCount:2,disposition:'RETIRE_GREENFIELD_BACKUP'},
  {table:'flyway_schema_history',sourceClass:'SCHEMA_TOOL_METADATA',sourceFieldCount:1,disposition:'REPLACED_BY_PLATFORM_MIGRATION_METADATA'},
  {table:'smrithi_application',sourceClass:'LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION',sourceFieldCount:2,disposition:'PENDING_PRODUCT_DECISION'},
]});
const run=(s=source(),r=review())=>reconcileDb00(s,r);
const errors=x=>x.errors.map(e=>e.code);
test('accepts explicit greenfield backup dispositions, not as runtime verification',()=>{
 const x=run();assert.equal(x.valid,true);assert.deepEqual(x.errors,[]);assert.equal(x.databaseVerified,false);
 assert.equal(x.summary.retiredBackupFields,2);assert.equal(x.summary.replacedMetadataFields,1);
 assert.equal(x.summary.pendingProductFields,2);assert.equal(x.smrithiProductDecisionClosed,false);
});
test('distinguishes raw backup CLASSIFY status from source-owned retirement disposition',()=>{
 const x=run();assert.equal(x.summary.sourceLedgerRetirementCandidateRows,2);
 assert.equal(x.summary.sourceDispositionClosedFields,3);
});
test('does not silently retire Smrithi when product decision absent',()=>{
 const r=review();r.tables[2].disposition='RETIRE_GREENFIELD_BACKUP';
 assert.ok(errors(run(source(),r)).includes('DISPOSITION_MISMATCH'));
});
test('cannot copy old source retirement onto unrelated product table',()=>{
 const r=review();r.tables[0].disposition='PENDING_PRODUCT_DECISION';
 assert.ok(errors(run(source(),r)).includes('DISPOSITION_MISMATCH'));
});
test('enforces oracle SHA identity',()=>{
 const r=review();r.legacyOracleSha='b'.repeat(40);
 assert.ok(errors(run(source(),r)).includes('LEGACY_ORACLE_DRIFT'));
});
test('requires well-formed pinned SHA',()=>{
 const s=source();s.sourceSha='moving-prod-2026';
 assert.ok(errors(run(s,review())).includes('LEGACY_ORACLE_DRIFT'));
});
test('catches missing backup disposition',()=>{
 const r=review();r.tables=r.tables.slice(1);
 assert.ok(errors(run(source(),r)).includes('MISSING_TABLE_DISPOSITION'));
});
test('catches extra unowned disposition',()=>{
 const r=review();r.tables.push({table:'phantom',sourceClass:'SCHEMA_TOOL_METADATA',sourceFieldCount:1,disposition:'REPLACED_BY_PLATFORM_MIGRATION_METADATA'});
 assert.ok(errors(run(source(),r)).includes('DISPOSITION_UNKNOWN_TABLE'));
});
test('catches duplicate disposition entries',()=>{
 const r=review();r.tables.push(r.tables[0]);
 assert.ok(errors(run(source(),r)).includes('DUPLICATE_OR_INVALID_DISPOSITION'));
});
test('catches same-name source table duplicated',()=>{
 const s=source();s.tables.push(s.tables[0]);
 assert.ok(errors(run(s,review())).includes('DUPLICATE_OR_INVALID_SOURCE_TABLE'));
});
test('rejects changed field count in disposition',()=>{
 const r=review();r.tables[0].sourceFieldCount=99;
 assert.ok(errors(run(source(),r)).includes('DISPOSITION_FIELD_COUNT_MISMATCH'));
});
test('rejects inconsistent aggregate summary even if per-table data is valid',()=>{
 const r=review();r.counts.fieldCandidatesDispositionedByTableDecision=5;
 assert.ok(errors(run(source(),r)).includes('REVIEW_TOTAL_DRIFT'));
});
test('rejects source table count mismatch',()=>{
 const s=source();s.counts.tables=4;
 assert.ok(errors(run(s,review())).includes('SOURCE_TOTAL_DRIFT'));
});
test('rejects source/decision class mismatch',()=>{
 const r=review();r.tables[1].sourceClass='HISTORICAL_BACKUP_VALIDATE_RETIREMENT';
 assert.ok(errors(run(source(),r)).includes('DISPOSITION_MISMATCH'));
});
test('rejects wrong domain metadata',()=>{
 const r=review();r.domain='DB10_SHARED_OPERATIONS';
 assert.ok(errors(run(source(),r)).includes('WRONG_DOMAIN'));
});
test('fail-closed empty input',()=>{
 assert.ok(errors(run(null,review())).includes('INVALID_INPUT'));
});
test('Node CLI confirms synthetic disposition and refuses incorrect review',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'db00-overlay-'));
 const file=name=>path.join(root,'docs/planning',name);
 try{
  fs.mkdirSync(path.join(root,'docs/planning'),{recursive:true});
  fs.writeFileSync(file('db-pass4-columns-db00_historical_and_engine.json'),JSON.stringify(source()));
  fs.writeFileSync(file('db00-historical-engine-disposition.json'),JSON.stringify(review()));
  const command=path.resolve(import.meta.dirname,'../scripts/db19-db00-disposition-crosscheck.mjs');
  const ok=spawnSync(process.execPath,[command,root],{encoding:'utf8'});
  assert.equal(ok.status,0,ok.stderr);assert.equal(JSON.parse(ok.stdout).summary.pendingProductFields,2);
  const bad=review();bad.counts.pendingProductDecisionFields=0;
  fs.writeFileSync(file('db00-historical-engine-disposition.json'),JSON.stringify(bad));
  const rejected=spawnSync(process.execPath,[command,root],{encoding:'utf8'});
  assert.equal(rejected.status,2,rejected.stderr);
  assert.ok(JSON.parse(rejected.stdout).errors.some(x=>x.code==='REVIEW_TOTAL_DRIFT'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

const approvedScope=()=>({
 schemaVersion:1,taskId:'DB-003',
 decisionId:'DB003-SMRITHI-VNEXT-EXCLUSION-2026-10-12',
 authority:'USER_EXPLICIT',userInstruction:'Please remove them not required',
 decision:'EXCLUDE_FROM_VNEXT',appliesTo:'42Students/lms-vnext',
 legacyBackendSha:sha,legacyProductionMutationAuthorized:false,
 dataMigrationRequired:false,externalConsumerAbsenceProven:false,
 counts:{tables:1,fields:2},
 tables:[{table:'smrithi_application',sourceFieldCount:2,decision:'RETIRE_VNEXT_USER_APPROVED'}],
});
const approvedReview=()=>{
 const r=review();
 r.tables[2].disposition='RETIRE_VNEXT_USER_APPROVED';
 r.tables[2].productApprovalId='DB003-SMRITHI-VNEXT-EXCLUSION-2026-10-12';
 r.counts.tableDispositionsClosed=3;
 r.counts.fieldCandidatesDispositionedByTableDecision=5;
 r.counts.pendingProductDecisionTables=0;
 r.counts.pendingProductDecisionFields=0;
 r.counts.approvedProductRetiredTables=1;
 r.counts.approvedProductRetiredFields=2;
 return r;
};
test('accepts approved vNext-only retirement and never asserts PostgreSQL runtime proof',()=>{
 const result=reconcileDb00(source(),approvedReview(),approvedScope());
 assert.equal(result.valid,true,JSON.stringify(result.errors));
 assert.equal(result.smrithiProductDecisionClosed,true);
 assert.equal(result.productScopeExclusionApproved,true);
 assert.equal(result.databaseVerified,false);
 assert.equal(result.summary.pendingProductFields,0);
 assert.equal(result.summary.approvedProductFields,2);
});
test('an attempted retirement without approval remains rejected',()=>{
 const result=reconcileDb00(source(),approvedReview());
 assert.ok(errors(result).includes('DISPOSITION_MISMATCH'));
 assert.equal(result.smrithiProductDecisionClosed,false);
});
test('wrong legacy oracle, wrong scope and mutation permission cannot authorize retirement',()=>{
 for(const mutation of [
  x=>{x.legacyBackendSha='b'.repeat(40);},
  x=>{x.appliesTo='42Students/lms';},
  x=>{x.legacyProductionMutationAuthorized=true;},
  x=>{x.externalConsumerAbsenceProven=true;},
  x=>{x.authority='SOURCE_SCAN';},
  x=>{x.userInstruction='inferred approval';},
  x=>{x.counts.fields=3;},
  x=>{x.tables[0].sourceFieldCount=4;},
  x=>{x.tables.push(x.tables[0]);},
 ]) {
  const approval=approvedScope();mutation(approval);
  const result=reconcileDb00(source(),approvedReview(),approval);
  assert.equal(result.valid,false,JSON.stringify(approval));
  assert.equal(result.smrithiProductDecisionClosed,false);
 }
});
test('missing or incorrect table approval ID is not accepted',()=>{
 const r=approvedReview();r.tables[2].productApprovalId='wrong';
 assert.ok(errors(reconcileDb00(source(),r,approvedScope())).includes('DISPOSITION_MISMATCH'));
});
