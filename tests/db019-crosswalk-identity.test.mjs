import test from "node:test";
import assert from "node:assert/strict";
import { CROSSWALKS, reconcileCrosswalk, reconcileCheckout } from "../scripts/db019-crosswalk-identity.mjs";

const ledger = (domain, names=["id","name"], other=[])=>({
  domain:CROSSWALKS[domain][0].toUpperCase(), sourceSha:"a".repeat(40),
  tables:[{table:"alpha",sourceDisposition:"ACTIVE_SOURCE_CONTRACT",
    rows:names.map(legacyColumn=>({legacyColumn}))},...other],
});
const crosswalk=(domain,names=["id","name"])=>{
  const rows=names.map(legacyColumn=>({legacyTable:"alpha",legacyColumn}));
  if(["DB01","DB04","DB07","DB09","DB10"].includes(domain))return {legacyBackendSha:"a".repeat(40),records:rows};
  if(domain==="DB03")return {legacyBackendSha:"a".repeat(40),fields:names.map(n=>({legacyColumn:"alpha."+n}))};
  if(domain==="DB05")return {legacyBackendSha:"a".repeat(40),fields:names.map(n=>({source:"alpha."+n}))};
  if(domain==="DB06")return {legacyBackendSha:"a".repeat(40),tables:[{legacyTable:"alpha",fields:names.map(legacyField=>({legacyField}))}]};
  return {legacyBackendSha:"a".repeat(40),tables:[{legacyTable:"alpha",fields:rows}]};
};
for(const domain of Object.keys(CROSSWALKS))test(domain+" crosswalk identity matches but proves no runtime parity",()=>{
  const x=reconcileCrosswalk(domain,ledger(domain),crosswalk(domain));
  assert.deepEqual(x.errors,[]);
  assert.equal(x.sourceFields,2);
  assert.equal(x.crosswalkFields,2);
  assert.equal(x.databaseVerified,false);
});
test("missing source identity in crosswalk is rejected",()=>{
  const x=reconcileCrosswalk("DB09",ledger("DB09"),crosswalk("DB09",["id"]));
  assert.deepEqual(x.missing,["alpha.name"]);
});
test("invented crosswalk field is rejected",()=>{
  const x=reconcileCrosswalk("DB08",ledger("DB08"),crosswalk("DB08",["id","name","fake"]));
  assert.deepEqual(x.extra,["alpha.fake"]);
});
test("duplicated source and crosswalk fields are independently rejected",()=>{
  const a=reconcileCrosswalk("DB07",ledger("DB07",["id","id"]),crosswalk("DB07",["id"]));
  const b=reconcileCrosswalk("DB07",ledger("DB07"),crosswalk("DB07",["id","id"]));
  assert.ok(a.errors.some(e=>e.code==="DUPLICATE_SOURCE_FIELDS"));
  assert.ok(b.errors.some(e=>e.code==="DUPLICATE_CROSSWALK_FIELDS"));
});
test("out-of-date legacy oracle is rejected",()=>{
  const x=reconcileCrosswalk("DB09",ledger("DB09"),{...crosswalk("DB09"),sourceSha:"b".repeat(40)});
  assert.ok(x.errors.some(e=>e.code==="LEGACY_SOURCE_SHA_DRIFT"));
});
test("stale DB05 inventory blob pin rejects semantic signoff",()=>{
  const x=reconcileCrosswalk("DB05",ledger("DB05"),{
    ...crosswalk("DB05"),source:{inventoryBlobSha:"b".repeat(40),legacyBackendSha:"a".repeat(40)}
  },"c".repeat(40));
  assert.ok(x.errors.some(e=>e.code==="INVENTORY_BLOB_SHA_DRIFT"));
});
test("DB06 historical candidate excluded, never auto-retired",()=>{
  const historic={table:"old",sourceDisposition:"HISTORICAL",rows:[{legacyColumn:"id"}]};
  const x=reconcileCrosswalk("DB06",ledger("DB06",["id","name"],[historic]),crosswalk("DB06"));
  assert.deepEqual(x.errors,[]);
  assert.equal(x.excludedHistoricalSourceFields,1);
  assert.equal(x.databaseVerified,false);
});
test("malformed crosswalk row and wrong ledger are rejected",()=>{
  const x=reconcileCrosswalk("DB01",ledger("DB01"),{records:[{legacyTable:"alpha",legacyColumn:null}]});
  assert.ok(x.errors.some(e=>e.code==="INVALID_CROSSWALK_IDENTITY"));
  assert.ok(reconcileCrosswalk("DB10",ledger("DB01"),crosswalk("DB10")).errors.some(
    e=>e.code==="INVALID_OR_WRONG_LEDGER"));
});
test("unknown source domain cannot be accepted",()=>{
  assert.throws(()=>reconcileCrosswalk("DB99",ledger("DB01"),{}),/Unknown domain/);
});

test("missing legacy oracle is rejected even when every field identity matches",()=>{
  const artifact=crosswalk("DB10");
  delete artifact.legacyBackendSha;
  const x=reconcileCrosswalk("DB10",ledger("DB10"),artifact);
  assert.ok(x.errors.some(e=>e.code==="MISSING_LEGACY_SOURCE_SHA"));
});
test("DB03 legacyOracleSha and DB08 capturedFrom backend are checked",()=>{
  const db03=crosswalk("DB03");delete db03.legacyBackendSha;
  db03.legacyOracleSha="b".repeat(40);
  assert.ok(reconcileCrosswalk("DB03",ledger("DB03"),db03).errors.some(
    e=>e.code==="LEGACY_SOURCE_SHA_DRIFT"));
  const db08=crosswalk("DB08");delete db08.legacyBackendSha;
  db08.capturedFrom={legacyBackendSha:"b".repeat(40)};
  assert.ok(reconcileCrosswalk("DB08",ledger("DB08"),db08).errors.some(
    e=>e.code==="LEGACY_SOURCE_SHA_DRIFT"));
});
test("DB01 triage uses immutable source inventory pin, not only field names",()=>{
  const a=crosswalk("DB01");delete a.legacyBackendSha;
  a.sourceInventory={legacyBackendSha:"a".repeat(40),blobSha:"b".repeat(40)};
  const mismatch=reconcileCrosswalk("DB01",ledger("DB01"),a,"c".repeat(40));
  assert.ok(mismatch.errors.some(e=>e.code==="INVENTORY_BLOB_SHA_DRIFT"));
  const match=reconcileCrosswalk("DB01",ledger("DB01"),a,"b".repeat(40));
  assert.deepEqual(match.errors,[]);
  assert.equal(match.pinChecked,true);
});

test("DB019 integrated gate accounts for 2829 independently checked source fields without runtime acceptance",()=>{
  const report=reconcileCheckout(process.cwd());
  assert.deepEqual(report.errors,[]);
  assert.equal(report.comparedFields,1844);
  assert.equal(report.sourceQualityFieldsChecked,2829);
  assert.deepEqual(report.independentlyCheckedBaseSourceDecisions,{db00:732,db01:312});
  assert.equal(report.semanticDecisionQuality.auditedSourceFields,762);
  assert.equal(report.remainingSemanticQuality.sourceFields,1023);
  assert.equal(report.projectRegisteredHistory.registeredColumnMatches,51);
  assert.equal(report.projectRegisteredHistory.legacySnapshotFields,12);
  assert.equal(report.sourceQualityOnly,true);
  assert.equal(report.acceptanceReady,false);
  assert.equal(report.databaseVerified,false);
  assert.equal(report.semanticDecisionQuality.acceptanceReady,false);
  assert.equal(report.remainingSemanticQuality.acceptanceReady,false);
});

test("conflicting legacy source SHA cannot be hidden behind a valid top-level pin",()=>{
  const a={...crosswalk("DB06"),sourceSha:"a".repeat(40),legacyBackendSha:"b".repeat(40)};
  const result=reconcileCrosswalk("DB06",ledger("DB06"),a);
  assert.ok(result.errors.some(e=>e.code==="LEGACY_SOURCE_SHA_DRIFT" &&
    e.location==="legacyBackendSha"));
});
test("a blank secondary oracle SHA is a failing pin, not an absent pin",()=>{
  const a={...crosswalk("DB07"),sourceSha:""};
  const result=reconcileCrosswalk("DB07",ledger("DB07"),a);
  assert.ok(result.errors.some(e=>e.code==="INVALID_LEGACY_SOURCE_SHA" &&
    e.location==="sourceSha"));
});
test("conflicting inventory blob SHA cannot hide behind a matching first pin",()=>{
  const a={...crosswalk("DB05"),source:{
    legacyBackendSha:"a".repeat(40),inventoryBlobSha:"b".repeat(40)},
    sourceInventory:{blobSha:"c".repeat(40)}};
  const result=reconcileCrosswalk("DB05",ledger("DB05"),a,"b".repeat(40));
  assert.ok(result.errors.some(e=>e.code==="INVENTORY_BLOB_SHA_DRIFT" &&
    e.location==="sourceInventory.blobSha"));
});
