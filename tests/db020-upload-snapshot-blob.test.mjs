import {test} from "node:test";
import assert from "node:assert/strict";
import {requireReviewedSnapshotCandidate} from "../scripts/db020-upload-snapshot-blob.mjs";
const sha="a".repeat(40);
const catalog={kind:"DB020_DISPOSABLE_PG17_REGISTERED_VS_GENERATED_DIAGNOSIS",
 passCertification:false,registeredHead:"0326_db020_validate_registered_checks",registeredMigrations:327,
 counts:{generatedTypedTables:267,generatedAbsentInRegisteredPg:0,generatedTypedMissingColumns:0,
 registeredExtraColumnsOnTypedTables:0,typedFkShapesMissingFromCatalog:0,unvalidatedFks:0,
 catalogOnlyFkShapesOnTypedTables:7,catalogOnlyFkShapesOnSqlOnlyTables:30}};
const semantic={kind:"DB020_REGISTERED_PG17_SEMANTIC_DRIFT_DIAGNOSIS",
 passCertification:false,registeredHead:catalog.registeredHead,registeredMigrations:327,
 counts:{catalogTables:277,hardDifferences:0,typedCheckNamesAbsentFromCatalog:0,
 typedIndexNamesAbsentFromCatalog:0,unvalidatedRegisteredConstraintsAllTypes:0,
 invalidPhysicalIndexes:0,disabledRegisteredTriggers:0,missingColumns:0}};
const defaults={kind:"DB020_REGISTERED_PG17_DEFAULT_PROOF",
 registeredHead:catalog.registeredHead,registeredMigrations:327,
 defaultsStructurallyReconciled:true,unexplained:[],missing:[],passCertification:false};
const snapshot={dialect:"postgresql",id:"c83a991c-0fab-4e1f-aa4a-61a779233551",
 tables:Object.fromEntries(Array.from({length:267},(_,i)=>["public.test_"+i,{}]))};
const inputs={catalog,semantic,defaults,snapshot,sourceSha:sha};
test("DB020 never certifies global phase when emitting only reviewed snapshot blob",()=>{
 const x=requireReviewedSnapshotCandidate(inputs);
 assert.equal(x.sourceSha,sha);assert.equal(x.typedTables,267);assert.equal(x.hardDifferences,0);
});
test("DB020 refuses incomplete default, FK or physical tenant/constraint review",()=>{
 assert.throws(()=>requireReviewedSnapshotCandidate({...inputs,
  defaults:{...defaults,defaultsStructurallyReconciled:false}}),/defaults/);
 assert.throws(()=>requireReviewedSnapshotCandidate({...inputs,
  catalog:{...catalog,counts:{...catalog.counts,typedFkShapesMissingFromCatalog:1}}}),/PG catalog/);
 assert.throws(()=>requireReviewedSnapshotCandidate({...inputs,
  semantic:{...semantic,counts:{...semantic.counts,unvalidatedRegisteredConstraintsAllTypes:1}}}),/semantic/);
});
test("DB020 rejects snapshot/table mismatch, stale SHA and accidental phase pass flag",()=>{
 assert.throws(()=>requireReviewedSnapshotCandidate({...inputs,snapshot:{...snapshot,tables:{}}}),/snapshot/);
 assert.throws(()=>requireReviewedSnapshotCandidate({...inputs,sourceSha:"branch-main"}),/SHA/);
 assert.throws(()=>requireReviewedSnapshotCandidate({...inputs,catalog:{...catalog,passCertification:true}}),/PG catalog/);
});
