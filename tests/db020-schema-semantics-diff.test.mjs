import {test} from "node:test";
import assert from "node:assert/strict";
import {inspectDb020StructuralSemantics} from "../scripts/db020-schema-semantics-diff.mjs";
const snapshot={dialect:"postgresql",id:"generated-fixture",tables:{"public.sample":{
 columns:{id:{name:"id",notNull:true},state:{name:"state",notNull:true,default:"'OPEN'"}},
 checkConstraints:{sample_state_ck:{value:"state in ('OPEN','DONE')"}},
 indexes:{sample_state_idx:{isUnique:false}},
}}};
const catalog={kind:"DB020_EXACT_REGISTERED_PG17_CATALOG",registeredHead:"0326_db020_validate_registered_checks",
 registeredMigrations:327,tables:[{name:"sample"}],
 columns:[{table_name:"sample",column_name:"id",not_null:true,default_expression:null},
 {table_name:"sample",column_name:"state",not_null:true,default_expression:"'OPEN'"}],
 constraints:[{table_name:"sample",name:"sample_state_ck",type:"c",validated:true,definition:"CHECK (state in ('OPEN','DONE'))"}],
 indexes:[{table_name:"sample",name:"sample_state_idx",unique:false,valid:true,primary:false,definition:"CREATE INDEX ..."}],
 triggers:[]};
const diagnosis={kind:"DB020_DISPOSABLE_PG17_REGISTERED_VS_GENERATED_DIAGNOSIS",
 registeredHead:catalog.registeredHead,registeredMigrations:327,counts:{generatedTypedTables:1}};
const inspect=(patch={})=>inspectDb020StructuralSemantics(
 patch.snapshot??snapshot,patch.catalog??catalog,patch.diagnosis??diagnosis);
test("DB020 catalog matcher keeps diagnostic-only status even on exact fixture",()=>{
 const result=inspect();
 assert.equal(result.counts.hardDifferences,0);
 assert.equal(result.counts.rawDefaultExpressionDifferences,0);
 assert.equal(result.passCertification,false);
 assert.equal(result.requiresHumanSqlReview,true);
});
test("DB020 refuses inconsistent artifact provenance",()=>{
 assert.throws(()=>inspect({catalog:{...catalog,registeredMigrations:326}}),/refuse unrelated/);
 assert.throws(()=>inspect({snapshot:{...snapshot,tables:{}}}),/table census/);
 assert.throws(()=>inspect({catalog:{...catalog,registeredMigrations:300},
  diagnosis:{...diagnosis,registeredMigrations:300}}),/require 0326/);
});
test("DB020 flags nullable drift, unvalidated CHECK, invalid index and uniqueness weakening",()=>{
 const changed={...catalog,
  columns:catalog.columns.map(c=>c.column_name==="state"?{...c,not_null:false}:c),
  constraints:[{...catalog.constraints[0],validated:false}],
  indexes:[{...catalog.indexes[0],valid:false,unique:true}]};
 const r=inspect({catalog:changed});
 assert.equal(r.counts.nullabilityDifferences,1);
 assert.equal(r.counts.typedChecksUnvalidatedInCatalog,1);
 assert.equal(r.counts.unvalidatedRegisteredConstraintsAllTypes,1);
 assert.equal(r.counts.typedIndexesInvalidInCatalog,1);
 assert.equal(r.counts.invalidPhysicalIndexes,1);
 assert.ok(r.counts.hardDifferences>0);
});
test("DB020 classifies absent names and raw default differences without false acceptance",()=>{
 const changed={...catalog,columns:catalog.columns.map(c=>c.column_name==="state"?{...c,default_expression:"'CLOSED'"}:c),
  constraints:[],indexes:[]};
 const r=inspect({catalog:changed});
 assert.equal(r.counts.rawDefaultExpressionDifferences,1);
 assert.equal(r.counts.typedCheckNamesAbsentFromCatalog,1);
 assert.equal(r.counts.typedIndexNamesAbsentFromCatalog,1);
 assert.equal(r.passCertification,false);
});
test("DB020 exposes unmodeled physical contracts and disabled triggers",()=>{
 const changed={...catalog,
 constraints:[...catalog.constraints,{table_name:"sample",name:"sql_only_ck",type:"c",validated:true,definition:"CHECK (id IS NOT NULL)"}],
 indexes:[...catalog.indexes,{table_name:"sample",name:"sql_only_idx",unique:true,primary:false,valid:true,definition:"CREATE UNIQUE INDEX ..."}],
 triggers:[{table_name:"sample",name:"scope_guard",enabled:"D"}]};
 const r=inspect({catalog:changed});
 assert.equal(r.counts.registeredChecksNotNamedByTypedSchema,1);
 assert.equal(r.counts.registeredIndexesNotNamedByTypedSchema,1);
 assert.equal(r.counts.disabledRegisteredTriggers,1);
});
