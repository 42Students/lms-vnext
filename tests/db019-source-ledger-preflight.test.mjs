import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {auditDb019,loadDb019} from '../scripts/db019-source-ledger-preflight.mjs';

test('DB019 all 11 frozen source ledgers reconcile 199 tables and 2829 fields without acceptance inflation',()=>{
  const result=loadDb019();
  assert.deepEqual(result.errors,[]);
  assert.equal(result.valid,true);
  assert.deepEqual(result.census,{tables:199,fields:2829,domains:11});
  assert.equal(result.sourceOnly,true);
  assert.equal(result.acceptanceReady,false);
  assert.deepEqual(result.progress.db00SourceDecisionCoverage, {
    totalFields: 732,
    sourceDispositionClosedFields: 732,
    greenfieldBackupExcludedFields: 631,
    platformMetadataReplacedFields: 10,
    userApprovedProductScopeExcludedFields: 91,
    productDecisionPendingFields: 0,
    runtimeMappingsVerifiedByThisOverlay: 0,
    remainingGlobalFieldsNotDisposedByDb00: 2097,
  });
  assert.deepEqual(result.progress.db01SourceDecisionCoverage, {
    sourceFields:312,
    explicitDecisionRows:312,
    targetProposalsStillUnverified:175,
    crossDomainHandoffs:95,
    runtimeMappingsVerifiedByThisOverlay:0,
  });
  assert.deepEqual(result.progress.db004PriorTechnicalCoverage, {
    ownerFields:195,
    priorRegisteredPhysicalWitnessRows:137,
    priorCompositeImplementationRows:24,
    requesterApprovedRetirementRows:34,
    otherDb01SourceDecisionsNotInDb004:117,
    freshGlobalPostgresCertification:false,
  });
  assert.equal(result.progress.awaitingSourceEvidence+result.progress.sourceEvidenceRows,2829);
  assert.equal(result.domains.reduce((s,d)=>s+d.fields,0),2829);
});

test('DB019 never claims phase acceptance from an incomplete source inventory',()=>{
  const report=auditDb019({artifacts:[],domainCounts:{},trackedTables:0,sourceFields:0},[],{decisions:[]});
  assert.equal(report.valid,false);
  assert.equal(report.acceptanceReady,false);
  assert(report.errors.some(x=>x.code==='SOURCE_INDEX_DENOMINATOR'));
});

test('DB019 detects mismatched oracle or malformed field ledger',()=>{
  const index={trackedTables:199,sourceFields:2829,sourceLegacySha:'a'.repeat(40),
    domainCounts:{DB00:{tables:1,fields:1}},artifacts:[{domain:'DB00',fields:1}]};
  const ledger={domain:'DB00',sourceSha:'b'.repeat(40),tables:[]};
  const report=auditDb019(index,[ledger],{decisions:[]});
  assert.equal(report.valid,false);
  assert(report.errors.some(x=>x.code==='LEDGER_SOURCE_OR_DOMAIN_MISMATCH'));
  assert.equal(report.acceptanceReady,false);
});

// DB00 decisions are independently pinned; a forged approval cannot reduce the backlog.
test('DB019 refuses unapproved DB00 scope exclusions and source-decision count drift',()=>{
  const read=path=>JSON.parse(fs.readFileSync(new URL('../docs/planning/'+path,import.meta.url),'utf8'));
  const index=read('database-parity-pass4-column-index.json');
  const ledgers=index.artifacts.map(x=>JSON.parse(fs.readFileSync(new URL('../'+x.path,import.meta.url),'utf8')));
  const decisions=read('database-parity-pass4-review-decisions.json');
  const db00Disposition=read('db00-historical-engine-disposition.json');
  const db00Approval=read('db003-smrithi-vnext-scope-decision.json');
  const unapproved=auditDb019(index,ledgers,decisions,{db00Disposition,db00Approval:{...db00Approval,authority:'UNKNOWN'}});
  assert.equal(unapproved.valid,false);
  assert.equal(unapproved.progress.db00SourceDecisionCoverage,null);
  assert(unapproved.errors.some(x=>x.code==='DB00_DISPOSITION_INVALID_PRODUCT_APPROVAL_SCOPE_OR_EVIDENCE'));
  const changed=structuredClone(db00Disposition);
  changed.tables[0].sourceFieldCount++;
  const mismatch=auditDb019(index,ledgers,decisions,{db00Disposition:changed,db00Approval});
  assert.equal(mismatch.valid,false);
  assert.equal(mismatch.progress.db00SourceDecisionCoverage,null);
  assert(mismatch.errors.some(x=>x.code==='DB00_DISPOSITION_DISPOSITION_FIELD_COUNT_MISMATCH'));
});

test('DB019 never assumes DB00 approved without a supplied independent review',()=>{
  const read=path=>JSON.parse(fs.readFileSync(new URL('../docs/planning/'+path,import.meta.url),'utf8'));
  const index=read('database-parity-pass4-column-index.json');
  const ledgers=index.artifacts.map(x=>JSON.parse(fs.readFileSync(new URL('../'+x.path,import.meta.url),'utf8')));
  const report=auditDb019(index,ledgers,read('database-parity-pass4-review-decisions.json'));
  assert.equal(report.valid,true);
  assert.equal(report.progress.db00SourceDecisionCoverage,null);
  assert.equal(report.acceptanceReady,false);
});

test('DB019 DB01 source decisions are pinned to the global legacy field identities',()=>{
  const read=path=>JSON.parse(fs.readFileSync(new URL('../docs/planning/'+path,import.meta.url),'utf8'));
  const index=read('database-parity-pass4-column-index.json');
  const ledgers=index.artifacts.map(x=>JSON.parse(fs.readFileSync(new URL('../'+x.path,import.meta.url),'utf8')));
  const decisions=read('database-parity-pass4-review-decisions.json');
  const db01Triage=read('db01-chat02-312-field-source-triage.json');
  const db01Final=read('db01-chat05-final-field-disposition.json');
  const changed=structuredClone(db01Final);
  changed.source.legacyBackendSha='0'.repeat(40);
  const drift=auditDb019(index,ledgers,decisions,{db01Triage,db01Final:changed});
  assert.equal(drift.valid,false);
  assert.equal(drift.progress.db01SourceDecisionCoverage,null);
  assert(drift.errors.some(x=>x.code==='DB01_DECISION_LEGACY_ORACLE_DRIFT'));
  const invented=structuredClone(db01Final);
  invented.rows[0].legacyField='forged_table.id';
  const falseIdentity=auditDb019(index,ledgers,decisions,{db01Triage,db01Final:invented});
  assert.equal(falseIdentity.valid,false);
  assert.equal(falseIdentity.progress.db01SourceDecisionCoverage,null);
  assert(falseIdentity.errors.some(x=>x.code==='DB01_DECISION_UNKNOWN_SOURCE_FIELD'));
  const partial=auditDb019(index,ledgers,decisions,{db01Triage});
  assert(partial.errors.some(x=>x.code==='PARTIAL_DB01_SOURCE_DECISION_INPUT'));
  assert.equal(partial.progress.db01SourceDecisionCoverage,null);
});

test('DB019 rejects forged DB004 registered field receipts while retaining upstream source decisions',()=>{
  const read=path=>JSON.parse(fs.readFileSync(new URL('../docs/planning/'+path,import.meta.url),'utf8'));
  const index=read('database-parity-pass4-column-index.json');
  const ledgers=index.artifacts.map(x=>JSON.parse(fs.readFileSync(new URL('../'+x.path,import.meta.url),'utf8')));
  const decisions=read('database-parity-pass4-review-decisions.json');
  const db01Triage=read('db01-chat02-312-field-source-triage.json');
  const db01Final=read('db01-chat05-final-field-disposition.json');
  const db004Evidence=read('db004-current-owner-evidence.json');
  const tampered=structuredClone(db004Evidence);
  const physical=tampered.rows.find(x=>x.physicalVerified);
  physical.runtimeEvidence.passingRun='https://example.test/forged';
  const bad=auditDb019(index,ledgers,decisions,{db01Triage,db01Final,db004Evidence:tampered});
  assert.equal(bad.valid,false);
  assert.equal(bad.progress.db004PriorTechnicalCoverage,null);
  assert.equal(bad.progress.db01SourceDecisionCoverage.explicitDecisionRows,312);
  assert(bad.errors.some(x=>x.code==='DB004_OWNER_EVIDENCE_UNSUPPORTED_PROOF'));
  const duplicate=structuredClone(db004Evidence);
  duplicate.rows[1].legacyField=duplicate.rows[0].legacyField;
  const wrong=auditDb019(index,ledgers,decisions,{db01Triage,db01Final,db004Evidence:duplicate});
  assert.equal(wrong.valid,false);
  assert.equal(wrong.progress.db004PriorTechnicalCoverage,null);
  assert(wrong.errors.some(x=>x.code==='DB004_OWNER_EVIDENCE_FIELD_DRIFT'));
});
