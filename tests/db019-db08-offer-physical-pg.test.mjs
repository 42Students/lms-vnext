import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Pool} from "pg";

const ledger=JSON.parse(readFileSync(
  new URL("../docs/planning/database-parity-db08-field-ledger.json",import.meta.url),"utf8"));
const offer=ledger.tables.find(t=>t.legacyTable==="job_offer");
const databaseUrl=process.env.TEST_DATABASE_URL??"";
const url=databaseUrl?new URL(databaseUrl):null;
if(process.env.DB019_DISPOSABLE_TEST_DATABASE!=="true"||
  !url||!url.pathname.endsWith("_test")||
  (process.env.DATABASE_URL&&process.env.DATABASE_URL!==databaseUrl)){
  throw new Error("DB019 physical witness requires explicit disposable *_test PostgreSQL target");
}
const pool=new Pool({connectionString:databaseUrl,max:2,connectionTimeoutMillis:5000});
test.after(async()=>{await pool.end();});

test("DB019 28 frozen job_offer decisions have all proposed target columns in registered PG17",async()=>{
  assert.equal(offer?.fields?.length,28,"Source-offer field denominator must not drift");
  assert.ok(offer.fields.every(r=>r.status==="UNVERIFIED"));
  const decisions=offer.fields.map(field=>({
    source:field.legacyColumn,...field.reviewDecision,
  }));
  assert.equal(decisions.length,28);
  assert.equal(decisions.filter(x=>x.classification==="EXPLICIT_RUNTIME_GAP").length,1);
  assert.equal(decisions.filter(x=>x.classification==="NEEDS_ENUM_CROSSWALK").length,2);
  assert.equal(decisions.filter(x=>x.classification==="PROPOSED_ACTIVE_FIELD_MAPPING").length,25);
  assert.ok(decisions.every(x=>x.runtimeVerified===false&&x.consumerVerified===false&&x.retirementApproved===false));
  const allRefs=[...new Set(decisions.flatMap(x=>x.targetRefs))];
  const tableNames=[...new Set(allRefs.map(ref=>ref.split(".")[0]))];
  assert.deepEqual(tableNames.sort(),
    ["placement_joining_outcomes","placement_offer_status_history","placement_offers"]);
  const rows=await pool.query(`
    select table_name,column_name,udt_name,is_nullable
    from information_schema.columns
    where table_schema='public' and table_name=any($1::text[])
  `,[tableNames]);
  const physical=new Map(rows.rows.map(row=>[
    row.table_name+"."+row.column_name,row,
  ]));
  for(const field of decisions){
    for(const ref of field.targetRefs){
      const col=physical.get(ref);
      assert.ok(col,field.source+" points to absent registered PG17 column "+ref);
    }
  }
  assert.notEqual(physical.get("placement_offers.version")?.udt_name,null);
  assert.notEqual(physical.get("placement_offers.row_version")?.udt_name,null);
  assert.equal(physical.get("placement_offers.legacy_offer_id")?.udt_name,"int4");
  assert.equal(physical.get("placement_offers.id")?.udt_name,"uuid");
  assert.equal(physical.get("placement_offers.accepted_disputable_until")?.udt_name,"timestamptz");
  assert.equal(physical.get("placement_offers.fixed_lpa")?.udt_name,"numeric");
  assert.equal(physical.get("placement_joining_outcomes.joining_date")?.udt_name,"date");
});

test("DB019 offer enum, immutable transition and active-application constraints survive journal replay",async()=>{
  const constraints=await pool.query(`
    select conrelid::regclass::text as on_table,conname,
      pg_get_constraintdef(oid) as definition
    from pg_constraint where conrelid in (
      'public.placement_offers'::regclass,
      'public.placement_joining_outcomes'::regclass,
      'public.placement_offer_status_history'::regclass
    )
  `);
  const byName=new Map(constraints.rows.map(r=>[r.conname,r]));
  const expected=[
    ["placement_offers_kind_ck","LOI"],
    ["placement_offers_status_ck","ACCEPTED"],
    ["placement_offers_row_version_ck","row_version"],
    ["placement_offers_acceptance_channel_ck","EXTERNAL_IMPORT"],
    ["placement_joining_outcomes_status_ck","DID_NOT_JOIN"],
    ["placement_offer_status_history_transition_ck","ISSUED"],
  ];
  for(const [name,expectedText] of expected){
    const record=byName.get(name);
    assert.ok(record,"Missing registered constraint "+name);
    assert.equal(record.definition.includes(expectedText),true,
      name+" does not enforce "+expectedText);
  }
  const fk=constraints.rows.filter(x=>x.on_table==="placement_offers"||
    x.on_table==="public.placement_offers").filter(x=>
      x.definition.startsWith("FOREIGN KEY") &&
      x.definition.includes("(application_id)") &&
      x.definition.includes("placement_applications"));
  assert.ok(fk.length>=1,"Offer application FK is not registered");
  const indexes=await pool.query(`
    select indexname,indexdef from pg_indexes
    where schemaname='public' and tablename='placement_offers'
  `);
  const unique=indexes.rows.find(x=>x.indexname==="placement_offers_active_application_uq");
  assert.ok(unique,"One active offer per application unique index not registered");
  assert.match(unique.indexdef,/UNIQUE INDEX/);
  assert.match(unique.indexdef,/application_id/);
  assert.match(unique.indexdef,/ISSUED/);
  assert.match(unique.indexdef,/ACCEPTED/);
});
