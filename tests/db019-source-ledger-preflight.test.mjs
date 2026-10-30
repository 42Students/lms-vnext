import assert from 'node:assert/strict';
import {test} from 'node:test';
import {auditDb019,loadDb019} from '../scripts/db019-source-ledger-preflight.mjs';

test('DB019 all 11 frozen source ledgers reconcile 199 tables and 2829 fields without acceptance inflation',()=>{
  const result=loadDb019();
  assert.deepEqual(result.errors,[]);
  assert.equal(result.valid,true);
  assert.deepEqual(result.census,{tables:199,fields:2829,domains:11});
  assert.equal(result.sourceOnly,true);
  assert.equal(result.acceptanceReady,false);
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
