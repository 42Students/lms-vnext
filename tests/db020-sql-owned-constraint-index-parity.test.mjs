// DB020: pin SQL-owned CHECK/index definitions that the Drizzle typed model
// deliberately does not name. Provenance is exact successful PG17 run
// https://github.com/42Students/lms-vnext/actions/runs/41151964447
// (registered through 0328, no generated migration). This does NOT certify
// runtime privacy/tenant semantics or replace owner review.
import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

const semantic=JSON.parse(readFileSync(".verification/db020-semantic-disposition.json","utf8"));
const catalog=JSON.parse(readFileSync(".verification/db020-registered-catalog-full.json","utf8"));
const expected={
 check:{count:13,sha256:"4ff94c680ddaf3867a81d615704a845b3f7bdacfab0208da15b7021e3a148166"},
 index:{count:28,sha256:"370339aaad59d192627b70852362e7c09952c96baa39502002020ecfff9f103a"},
};
function sourceRows(items,kind){
 return items.map(x=>[x.table,x.name,x.definition,kind==="check"?x.validated:x.valid,
  kind==="check"?null:x.unique])
  .sort((a,b)=>(a[0]+"."+a[1]).localeCompare(b[0]+"."+b[1]));
}
function sha(rows){return createHash("sha256").update(JSON.stringify(rows)).digest("hex");}

test("DB020 SQL-only physical CHECK expression and validity fingerprints are pinned",()=>{
 assert.equal(semantic.kind,"DB020_REGISTERED_PG17_SEMANTIC_DRIFT_DIAGNOSIS");
 assert.equal(semantic.passCertification,false);
 assert.equal(semantic.registeredHead,catalog.registeredHead);
 assert.equal(semantic.registeredMigrations,catalog.registeredMigrations);
 assert.ok(semantic.registeredMigrations>=329,"need registered 0328 PG17 source");
 const checks=semantic.physicallyUnmodeledChecks;
 assert.equal(semantic.counts.registeredChecksNotNamedByTypedSchema,expected.check.count);
 assert.equal(checks.length,expected.check.count,"no omitted CHECKs in capped diagnostic");
 assert.ok(checks.every(x=>x.validated===true),"NOT VALID CHECK must never pass");
 assert.equal(sha(sourceRows(checks,"check")),expected.check.sha256,
  "SQL-owned CHECK definitions changed; review exact scope before certification");
});
test("DB020 SQL-owned physical index key/predicate/exclusion definitions are pinned",()=>{
 const indexes=semantic.physicallyUnmodeledIndexes;
 assert.equal(semantic.counts.registeredIndexesNotNamedByTypedSchema,expected.index.count);
 assert.equal(indexes.length,expected.index.count,"no omitted indexes in capped diagnostic");
 assert.ok(indexes.every(x=>x.valid===true),"invalid catalog index must never pass");
 assert.equal(sha(sourceRows(indexes,"index")),expected.index.sha256,
  "SQL-owned index/unique/exclusion definitions changed; review before certification");
});
test("DB020 SQL-owned constraints do not excuse missing typed-model constraints",()=>{
 assert.equal(semantic.counts.typedCheckNamesAbsentFromCatalog,0);
 assert.equal(semantic.counts.typedIndexNamesAbsentFromCatalog,0);
 assert.equal(semantic.counts.unvalidatedRegisteredConstraintsAllTypes,0);
 assert.equal(semantic.counts.invalidPhysicalIndexes,0);
 assert.equal(semantic.counts.disabledRegisteredTriggers,0);
 assert.equal(semantic.counts.hardDifferences,0);
});
