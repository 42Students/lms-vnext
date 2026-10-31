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


test("DB019 proposed job and private-application columns exist after registered PG17 replay",async()=>{
  const selected=ledger.tables.filter(x=>["job","job_application"].includes(x.legacyTable));
  assert.deepEqual(selected.map(x=>x.legacyTable),["job","job_application"]);
  assert.deepEqual(selected.map(x=>x.fields.length),[46,24]);
  const candidates=[...new Set(selected.flatMap(t=>t.fields.flatMap(x=>x.reviewDecision?.targetRefs??[])))];
  const tableNames=[...new Set(candidates.map(x=>x.split(".")[0]))];
  const rows=await pool.query(`
    select table_name,column_name,udt_name
    from information_schema.columns
    where table_schema='public' and table_name=any($1::text[])
  `,[tableNames]);
  const live=new Map(rows.rows.map(r=>[r.table_name+"."+r.column_name,r]));
  for(const ref of candidates){
    assert.ok(live.has(ref),"Source-reviewed candidate is missing in registered PostgreSQL: "+ref);
  }
  assert.equal(live.get("placement_jobs.id")?.udt_name,"uuid");
  assert.equal(live.get("placement_jobs.legacy_job_id")?.udt_name,"int4");
  assert.equal(live.get("placement_applications.id")?.udt_name,"uuid");
  assert.equal(live.get("placement_applications.membership_id")?.udt_name,"uuid");
  assert.equal(live.get("placement_application_private_artifacts.resume_history")?.udt_name,"jsonb");
  assert.equal(live.has("placement_applications.internal_notes"),false);
  assert.equal(live.has("placement_applications.resume_object_path"),false);
  assert.equal(live.has("placement_applications.assessment_url"),false);
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


test("DB019 10 historic application status-history proposals are physically bounded on registered PG17",async()=>{
  const history=ledger.tables.find(t=>t.legacyTable==="job_application_status_history");
  assert.equal(history?.fields.length,10);
  const rows=await pool.query(`
    select column_name,udt_name,is_nullable
      from information_schema.columns
     where table_schema='public'
       and table_name='placement_application_status_history'
  `);
  const columns=new Map(rows.rows.map(r=>[r.column_name,r]));
  const known=[...new Set(history.fields.flatMap(f=>f.reviewDecision?.targetRefs??[]))];
  for(const ref of known){
    const [table,col]=ref.split(".");
    assert.equal(table,"placement_application_status_history");
    assert.ok(columns.has(col),"Missing history candidate "+ref);
  }
  assert.equal(columns.get("id")?.udt_name,"uuid");
  assert.equal(columns.get("application_id")?.udt_name,"uuid");
  assert.equal(columns.get("actor_user_id")?.udt_name,"uuid");
  assert.equal(columns.get("actor_user_id")?.is_nullable,"NO");
  assert.equal(columns.get("from_status")?.is_nullable,"YES");
  assert.equal(columns.get("to_status")?.is_nullable,"NO");
  assert.equal(columns.get("created_at")?.udt_name,"timestamptz");
  assert.equal(columns.has("updated_at"),false);
  assert.equal(columns.has("is_deleted"),false);
  const checks=await pool.query(`
    select conname,pg_get_constraintdef(oid) as definition
      from pg_constraint
     where conrelid='public.placement_application_status_history'::regclass
  `);
  const byName=new Map(checks.rows.map(x=>[x.conname,x.definition]));
  for(const name of [
    "placement_application_status_history_from_ck",
    "placement_application_status_history_to_ck",
    "placement_application_status_history_transition_ck",
  ]){
    assert.ok(byName.has(name),"No registered state check "+name);
    assert.match(byName.get(name),/SUBMITTED/);
    assert.match(byName.get(name),/WITHDRAWN/);
  }
  // Source-history enum and nullable actor/tombstone differences are gaps.
  assert.equal(history.fields.every(f=>f.status==="UNVERIFIED"&&
    f.reviewDecision.runtimeVerified===false&&
    f.reviewDecision.consumerVerified===false&&
    f.reviewDecision.retirementApproved===false),true);
});

test("DB019 15 round-result proposals have registered typed PG17 candidates without false semantic acceptance",async()=>{
  const table=ledger.tables.find(x=>x.legacyTable==="round_result");
  assert.equal(table?.fields.length,15);
  const refs=[...new Set(table.fields.flatMap(f=>f.reviewDecision?.targetRefs??[]))];
  const columns=await pool.query(`
    select column_name,udt_name,is_nullable,numeric_precision,numeric_scale
      from information_schema.columns
     where table_schema='public' and table_name='placement_round_results'
  `);
  const live=new Map(columns.rows.map(r=>[r.column_name,r]));
  for(const ref of refs){
    const [tableName,col]=ref.split(".");
    assert.equal(tableName,"placement_round_results");
    assert.ok(live.has(col),"Registered PG17 candidate missing "+ref);
  }
  assert.equal(live.get("id")?.udt_name,"uuid");
  assert.equal(live.get("round_id")?.udt_name,"uuid");
  assert.equal(live.get("application_id")?.udt_name,"uuid");
  assert.equal(live.get("submitted_by_user_id")?.udt_name,"uuid");
  assert.equal(live.get("submitted_by_user_id")?.is_nullable,"NO");
  assert.equal(live.get("applied_by_user_id")?.is_nullable,"YES");
  assert.equal(live.get("score_percent")?.udt_name,"numeric");
  assert.equal(live.get("score_percent")?.numeric_scale,10);
  assert.equal(live.has("submitted_by_type"),false);
  assert.equal(live.has("superseded_by"),false);
  const constraints=await pool.query(`
    select conname,pg_get_constraintdef(oid) as definition
      from pg_constraint
     where conrelid='public.placement_round_results'::regclass
  `);
  const byName=new Map(constraints.rows.map(x=>[x.conname,x.definition]));
  for(const [name,word] of [
    ["placement_round_results_outcome_ck","PASS"],
    ["placement_round_results_waitlist_ck","HOLD"],
    ["placement_round_results_score_ck","100"],
    ["placement_round_results_source_ck","IMPORT"],
    ["placement_round_results_status_ck","SUPERSEDED"],
    ["placement_round_results_lifecycle_ck","APPLIED"],
  ]){
    assert.ok(byName.has(name),"Missing registered safety constraint "+name);
    assert.ok(byName.get(name).includes(word),"Constraint meaning drifted "+name);
  }
  const indexes=await pool.query(`
    select indexname,indexdef from pg_indexes
     where schemaname='public' and tablename='placement_round_results'
  `);
  const current=indexes.rows.find(x=>x.indexname==="placement_round_results_current_uq");
  assert.ok(current,"Current active round-result uniqueness missing");
  assert.match(current.indexdef,/UNIQUE INDEX/);
  assert.match(current.indexdef,/application_id/);
  assert.match(current.indexdef,/round_id/);
  assert.match(current.indexdef,/SUPERSEDED/);
  assert.equal(table.fields.every(f=>f.status==="UNVERIFIED" &&
    f.reviewDecision?.runtimeVerified===false &&
    f.reviewDecision?.consumerVerified===false &&
    f.reviewDecision?.retirementApproved===false),true);
});


test("DB019 27 attendance, override and season source proposals retain registered PG17 guardrails",async()=>{
  const scopes=[
    ["round_attendance","placement_round_attendance",8],
    ["job_eligibility_override","placement_eligibility_overrides",7],
    ["placement_season","placement_seasons",12],
  ];
  const names=scopes.map(x=>x[1]);
  const rows=await pool.query(`
    select table_name,column_name,udt_name,is_nullable
      from information_schema.columns
     where table_schema='public' and table_name=any($1::text[])
  `,[names]);
  const physical=new Map(rows.rows.map(x=>[x.table_name+"."+x.column_name,x]));
  for(const [sourceTable,table,count] of scopes){
    const source=ledger.tables.find(t=>t.legacyTable===sourceTable);
    assert.equal(source?.fields.length,count);
    for(const field of source.fields){
      const d=field.reviewDecision;
      assert.equal(field.status,"UNVERIFIED");
      assert.equal(d.runtimeVerified,false);
      assert.equal(d.consumerVerified,false);
      assert.equal(d.retirementApproved,false);
      for(const ref of d.targetRefs){
        assert.equal(ref.split(".")[0],table);
        assert.ok(physical.has(ref),"Missing registered PG17 source candidate "+ref);
      }
    }
  }
  for(const ref of [
    "placement_round_attendance.id",
    "placement_round_attendance.round_id",
    "placement_round_attendance.application_id",
    "placement_round_attendance.marked_by_user_id",
    "placement_eligibility_overrides.id",
    "placement_eligibility_overrides.job_id",
    "placement_eligibility_overrides.membership_id",
    "placement_eligibility_overrides.created_by_user_id",
    "placement_seasons.id","placement_seasons.college_id",
    "placement_seasons.created_by_user_id",
  ])assert.equal(physical.get(ref)?.udt_name,"uuid",ref+" must use a scoped UUID");
  for(const ref of [
    "placement_round_attendance.marked_by_user_id",
    "placement_eligibility_overrides.created_by_user_id",
    "placement_seasons.start_date","placement_seasons.end_date",
  ])assert.equal(physical.get(ref)?.is_nullable,"NO",ref+" must preserve live nullability");
  assert.equal(physical.get("placement_round_attendance.legacy_reset_to_waiting")?.udt_name,"bool");
  assert.equal(physical.get("placement_seasons.registration_deadline")?.udt_name,"timestamptz");
  assert.equal(physical.has("placement_seasons.blocked_dates"),false);
  assert.equal(physical.has("placement_seasons.version"),false);

  const constraints=await pool.query(`
    select conrelid::regclass::text as relation,conname,pg_get_constraintdef(oid) as definition
      from pg_constraint
     where conrelid::regclass::text=any($1::text[])
  `,[names]);
  const guards=new Map(constraints.rows.map(x=>[x.conname,x.definition]));
  for(const [name,fragment] of [
    ["placement_round_attendance_status_ck","IN_INTERVIEW"],
    ["placement_eligibility_overrides_decision_ck","INCLUDE"],
    ["placement_eligibility_overrides_reason_ck","length"],
    ["placement_seasons_status_ck","ACTIVE"],
    ["placement_seasons_dates_ck",">="],
    ["placement_seasons_registration_control_ck","registration_controlled"],
    ["placement_seasons_lifecycle_ck","closed_by_user_id"],
  ]){
    assert.ok(guards.has(name),"Missing registered check "+name);
    assert.ok(guards.get(name).includes(fragment),"Registered check meaning drifted "+name);
  }
  const indexes=await pool.query(`
    select tablename,indexname,indexdef from pg_indexes
     where schemaname='public' and tablename=any($1::text[])
  `,[names]);
  const required=[
    "placement_round_attendance_round_application_uq",
    "placement_eligibility_overrides_active_uq",
    "placement_seasons_college_code_uq",
    "placement_seasons_active_college_uq",
  ];
  for(const index of required){
    const found=indexes.rows.find(x=>x.indexname===index);
    assert.ok(found,"Registered unique constraint missing "+index);
    assert.match(found.indexdef,/UNIQUE INDEX/);
  }
});
