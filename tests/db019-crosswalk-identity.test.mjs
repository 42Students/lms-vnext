import test from "node:test";
import assert from "node:assert/strict";
import { CROSSWALKS, reconcileCrosswalk } from "../scripts/db019-crosswalk-identity.mjs";

const ledger = (domain, names=["id","name"], other=[])=>({
  domain:CROSSWALKS[domain][0].toUpperCase(), sourceSha:"a".repeat(40),
  tables:[{table:"alpha",sourceDisposition:"ACTIVE_SOURCE_CONTRACT",
    rows:names.map(legacyColumn=>({legacyColumn}))},...other],
});
const crosswalk=(domain,names=["id","name"])=>{
  const rows=names.map(legacyColumn=>({legacyTable:"alpha",legacyColumn}));
  if(["DB01","DB04","DB07","DB09","DB10"].includes(domain))return {records:rows};
  if(domain==="DB03")return {fields:names.map(n=>({legacyColumn:"alpha."+n}))};
  if(domain==="DB05")return {fields:names.map(n=>({source:"alpha."+n}))};
  if(domain==="DB06")return {tables:[{legacyTable:"alpha",fields:names.map(legacyField=>({legacyField}))}]};
  return {tables:[{legacyTable:"alpha",fields:rows}]};
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
