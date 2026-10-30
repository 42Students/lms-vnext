// DB-014 current registered PostgreSQL catalog witness. Read-only.
// Snapshot 0040 is historical; this checks the current applied journal and catalog.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if(process.env.DB014_STAGED_PG!=="YES")
  throw new Error("DB014 catalog requires explicitly disposable PG");
assertDb018DisposableTarget(process.env,{serviceBound:true});
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));

test("DB014 actual registered PG17 FK, history, trigger and cascade catalog",async()=>{
  const db=new pg.Client({
    connectionString:process.env.TEST_DATABASE_URL,
    connectionTimeoutMillis:10000,query_timeout:15000,
  });
  await db.connect();
  try{
    await db.query("BEGIN READ ONLY");
    const version=Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
    assert.ok(version>=170000&&version<180000,"PostgreSQL 17 required");
    const head=journal.entries.at(-1);
    assert.ok(head?.idx>40,"snapshot 0040 is stale, do not call it current");
    const applied=Number((await db.query(
      "SELECT count(*)::integer AS n FROM drizzle.__drizzle_migrations")).rows[0].n);
    assert.equal(applied,journal.entries.length,"exact zero-to-head journal replay needed");
    const tableResult=await db.query(
      "SELECT r.relname FROM pg_class r JOIN pg_namespace n ON n.oid=r.relnamespace "+
      "WHERE n.nspname='public' AND r.relkind='r'");
    const tables=new Set(tableResult.rows.map(x=>x.relname));
    for(const table of ["activity_events","in_app_notifications",
      "lms_group_member_events","lms_group_members","college_memberships"])
      assert.ok(tables.has(table),"Missing registered table "+table);
    const fkResult=await db.query(
      "SELECT r.relname AS child,f.confrelid::regclass::text AS parent,"+
      "f.conname,f.confdeltype,f.convalidated,cardinality(f.conkey)::integer AS child_columns "+
      "FROM pg_constraint f JOIN pg_class r ON r.oid=f.conrelid "+
      "JOIN pg_namespace n ON n.oid=r.relnamespace "+
      "WHERE n.nspname='public' AND f.contype='f' "+
      "ORDER BY r.relname,f.conname");
    const fks=fkResult.rows;
    assert.ok(fks.length>=211,"registered schema dropped historical FK baseline");
    const unvalidated=fks.filter(x=>x.convalidated!==true).map(x=>({child:x.child,parent:x.parent,name:x.conname}));
    assert.deepEqual(unvalidated,[],"Unvalidated registered FKs: "+JSON.stringify(unvalidated));
    const countFor=table=>fks.filter(x=>x.child===table).length;
    assert.ok(countFor("activity_events")>=4);
    assert.ok(countFor("in_app_notifications")>=2);
    assert.ok(countFor("lms_group_member_events")>=3);
    const triggerResult=await db.query(
      "SELECT r.relname AS child,t.tgname,t.tgenabled "+
      "FROM pg_trigger t JOIN pg_class r ON r.oid=t.tgrelid "+
      "JOIN pg_namespace n ON n.oid=r.relnamespace "+
      "WHERE n.nspname='public' AND NOT t.tgisinternal "+
      "ORDER BY r.relname,t.tgname");
    const triggers=new Map(triggerResult.rows.map(x=>[x.child+"."+x.tgname,x.tgenabled]));
    const assertGuardActive=(table,name)=>{
      const state=triggers.get(table+"."+name);
      assert.ok(state==="O"||state==="A",
        "Registered tenant guard is missing or disabled for ordinary writes: "+table+"."+name+" (state="+state+")");
    };
    for(const [table,name] of [
      ["lms_group_members","db03_member_tenant_guard"],
      ["elective_slots","db03_elective_slot_scope_guard"],
      ["elective_offerings","db03_elective_offering_scope_guard"],
      ["project_instances","db03_project_team_scope_guard"]
    ])assertGuardActive(table,name);
    const guardsRegistered=journal.entries.some(
      entry=>entry.tag==="0318_db014_cross_domain_event_guards");
    const newlyPromoted=[
      ["activity_events","db14_activity_event_scope_guard"],
      ["in_app_notifications","db14_notification_recipient_scope_guard"],
      ["lms_group_member_events","db14_group_member_event_scope_guard"],
    ];
    for(const [table,name] of newlyPromoted){
      const exists=triggers.has(table+"."+name);
      assert.equal(exists,guardsRegistered,
        "Exact journal to registered trigger mismatch: "+table+"."+name);
      if(guardsRegistered)assertGuardActive(table,name);
    }
    const uniqueResult=await db.query(
      "SELECT t.relname AS table_name,i.relname AS index_name, "+
      "pg_get_indexdef(ix.indexrelid) AS definition "+
      "FROM pg_index ix JOIN pg_class t ON t.oid=ix.indrelid "+
      "JOIN pg_namespace n ON n.oid=t.relnamespace "+
      "JOIN pg_class i ON i.oid=ix.indexrelid "+
      "WHERE n.nspname='public' AND ix.indisunique AND "+
      "EXISTS (SELECT 1 FROM pg_attribute a "+
      "WHERE a.attrelid=t.oid AND a.attname='college_id') "+
      "ORDER BY t.relname,i.relname");
    const cascade=fks.filter(x=>x.confdeltype==="c");
    // Snapshot-only reviews can silently miss destructive FK changes. This
    // multiset pins the 21 CURRENT registered CASCADE edges, including the
    // duplicate composite/single-column relationships. Any new/removed edge
    // needs explicit retention review, not an automatic green count.
    const expectedCascadePairs = [
      [
            "assignment_submission_links -> assignment_submissions",
            1
      ],
      [
            "attendance_records -> section_schedule_events",
            1
      ],
      [
            "attendance_sessions -> section_schedule_events",
            1
      ],
      [
            "cohort_progression_state -> cohorts",
            1
      ],
      [
            "course_discussion_messages -> course_section_deliveries",
            1
      ],
      [
            "lesson_content_delivery_sequences -> lesson_contents",
            2
      ],
      [
            "lesson_content_delivery_sequences -> course_section_deliveries",
            2
      ],
      [
            "lesson_content_materials -> lesson_contents",
            1
      ],
      [
            "log_alert_daily_counts -> log_alert_signatures",
            1
      ],
      [
            "log_alert_signature_accounts -> log_alert_signatures",
            1
      ],
      [
            "placement_cell_announcement_reads -> announcements",
            1
      ],
      [
            "placement_cell_announcement_reads -> colleges",
            1
      ],
      [
            "placement_drive_day_coordinator_assignments -> placement_jobs",
            1
      ],
      [
            "placement_drive_day_coordinator_assignments -> college_memberships",
            1
      ],
      [
            "placement_job_role_options -> placement_jobs",
            1
      ],
      [
            "placement_round_attendance -> placement_applications",
            1
      ],
      [
            "placement_round_attendance -> placement_job_rounds",
            1
      ],
      [
            "platform_broadcast_targets -> platform_broadcasts",
            1
      ],
      [
            "section_schedule_event_courses -> section_schedule_events",
            1
      ]
];
    const cascadeCounts = new Map();
    for (const edge of cascade) {
      const key = edge.child+" -> "+edge.parent;
      cascadeCounts.set(key,(cascadeCounts.get(key)??0)+1);
    }
    assert.deepEqual(
      [...cascadeCounts.entries()].sort((a,b)=>a[0].localeCompare(b[0])),
      expectedCascadePairs.sort((a,b)=>a[0].localeCompare(b[0])),
      "Registered ON DELETE CASCADE edges changed without DB014 retention review",
    );
    // A passing edge inventory is NOT proof that active/history parents
    // cannot be hard-deleted; those producer/release witnesses remain open.

    console.log(JSON.stringify({
      kind:"DB014_CURRENT_REGISTERED_PG17_CATALOG",
      journalHead:head.tag,expectedMigrations:journal.entries.length,
      appliedMigrations:applied,tableCount:tables.size,
      foreignKeys:fks.length,compositeForeignKeys:fks.filter(x=>x.child_columns>1).length,
      userDefinedTriggers:triggerResult.rows.length,
      cascadeForeignKeys:cascade.length,
      cascadeReview:cascade.map(x=>({child:x.child,parent:x.parent,constraint:x.conname})),
      directCollegeUniqueIndexes:uniqueResult.rows.length,
      groupHistoryDb14GuardRegistered:triggers.has(
        "lms_group_member_events.db14_group_member_event_scope_guard"),
      globalDb014Acceptance:false
    },null,2));
    await db.query("COMMIT");
  }catch(error){
    await db.query("ROLLBACK").catch(()=>{});
    throw error;
  }finally{
    await db.end();
  }
});
