import {test} from "node:test";
import assert from "node:assert/strict";
import {proveDefault,auditDb020Defaults} from "../scripts/db020-default-parity.mjs";
const field="test.status";
test("DB020 default proof admits only same literal with correct type-cast",()=>{
 assert.equal(proveDefault({field,typedType:"varchar(20)",pgType:"character varying(20)",
  typedDefault:"'OPEN'",pgDefault:"'OPEN'::character varying"}),
  "same-literal-with-resolved-pg-type-cast");
 assert.equal(proveDefault({field,typedType:"varchar(20)",pgType:"character varying(20)",
  typedDefault:"'OPEN'",pgDefault:"'CLOSED'::character varying"}),null);
 assert.equal(proveDefault({field,typedType:"integer",pgType:"integer",
  typedDefault:0,pgDefault:"0"}),"exact");
});
test("DB020 default proof rejects wrong enum cast and invented bigserial sequence",()=>{
 assert.equal(proveDefault({field,typedType:"my_status",pgType:"my_status",
  typedDefault:"'OPEN'",pgDefault:"'OPEN'::other_status"}),null);
 const args={field:"test.sequence",typedType:"bigserial",pgType:"bigint",
  typedDefault:null,pgDefault:"nextval('test_sequence_seq'::regclass)"};
 assert.equal(proveDefault(args),null);
 assert.equal(proveDefault({...args,bigserialProof:{
  field:args.field,pgDefault:args.pgDefault,ownedSequence:"public.test_sequence_seq"
 }}),"pg17-owned-bigserial-sequence");
});
test("DB020 proof understands JSON key order and refuses altered values",()=>{
 const args={field:"test.data",typedType:"jsonb",pgType:"jsonb",
  typedDefault:'\'{"x":1,"y":[2,3]}\'::jsonb',
  pgDefault:'\'{"y": [2, 3], "x": 1}\'::jsonb'};
 assert.equal(proveDefault(args),"same-jsonb-value");
 assert.equal(proveDefault({...args,pgDefault:'\'{"y":[3,2],"x":1}\'::jsonb'}),null);
});
test("DB020 special expressions must match exact reviewed field and SQL",()=>{
 const args={field:"placement_recruiter_college_grants.capabilities",
  typedType:"text[]",pgType:"text[]",
  typedDefault:"ARRAY['DRIVES']::text[]",pgDefault:"ARRAY['DRIVES'::text]"};
 assert.equal(proveDefault(args),"same-array-one-element-resolved-cast");
 assert.equal(proveDefault({...args,field:"other.capabilities"}),null);
});
test("DB020 default census refuses stale catalogs and reports unresolved fields",()=>{
 const snap={dialect:"postgresql",tables:{"public.test":{columns:{
  id:{name:"id",type:"integer",default:1},bad:{name:"bad",type:"text",default:"'A'"}
 }}}};
 const cat={kind:"DB020_EXACT_REGISTERED_PG17_CATALOG",registeredHead:"0326_db020_validate_registered_checks",
 registeredMigrations:327,columns:[
  {table_name:"test",column_name:"id",data_type:"integer",default_expression:"1"},
  {table_name:"test",column_name:"bad",data_type:"text",default_expression:"'B'::text"}]};
 const diag={kind:"DB020_DISPOSABLE_PG17_REGISTERED_VS_GENERATED_DIAGNOSIS",
  registeredHead:cat.registeredHead,registeredMigrations:327,verifiedBigserialSemantics:[]};
 const r=auditDb020Defaults(snap,cat,diag);
 assert.equal(r.defaultsStructurallyReconciled,false);
 assert.deepEqual(r.unexplained.map(x=>x.field),["test.bad"]);
 assert.equal(r.passCertification,false);
 assert.throws(()=>auditDb020Defaults(snap,cat,{...diag,registeredMigrations:326}),/exact registered/);
});
