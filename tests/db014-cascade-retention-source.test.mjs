import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const sql=readFileSync("drizzle/0325_db014_cascade_retention_fences.sql","utf8");
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
const expected=[
  [
    "assignment_submissions",
    "assignment_submission_links",
    "submission_id"
  ],
  [
    "section_schedule_events",
    "attendance_records",
    "schedule_event_id"
  ],
  [
    "section_schedule_events",
    "attendance_sessions",
    "schedule_event_id"
  ],
  [
    "course_section_deliveries",
    "course_discussion_messages",
    "delivery_id"
  ],
  [
    "announcements",
    "placement_cell_announcement_reads",
    "announcement_id"
  ],
  [
    "colleges",
    "placement_cell_announcement_reads",
    "college_id"
  ],
  [
    "placement_jobs",
    "placement_drive_day_coordinator_assignments",
    "job_id"
  ],
  [
    "college_memberships",
    "placement_drive_day_coordinator_assignments",
    "learner_membership_id"
  ],
  [
    "placement_applications",
    "placement_round_attendance",
    "application_id"
  ],
  [
    "placement_job_rounds",
    "placement_round_attendance",
    "round_id"
  ],
  [
    "platform_broadcasts",
    "platform_broadcast_targets",
    "broadcast_id"
  ]
];

test("DB014 numbered retention migration protects every designated parent-child cascade",()=>{
 assert.ok(journal.entries.some(x=>x.tag==="0325_db014_cascade_retention_fences"),"0325 must be registered");
 assert.equal((sql.match(/CREATE TRIGGER db14_cascade_retention_\d\d BEFORE DELETE/g)||[]).length,expected.length);
 for(const [index,[parent,child,fk]] of expected.entries()){
   const number=String(index+1).padStart(2,"0");
   assert.ok(sql.includes("db14_cascade_retention_"+number+" BEFORE DELETE ON "+parent),"missing parent "+parent);
   assert.ok(sql.includes("db14_cascade_retention_delete_guard('"+child+"','"+fk+"')"),"missing child scope "+child+"."+fk);
 }
 const parents=new Set(expected.map(x=>x[0]));
 assert.equal((sql.match(/CREATE TRIGGER db14_truncate_retention_\d\d BEFORE TRUNCATE/g)||[]).length,parents.size);
 for(const parent of parents)assert.ok(sql.includes("BEFORE TRUNCATE ON "+parent));
 assert.match(sql,/TG_ARGV\[0\], TG_ARGV\[1\]/);
 assert.match(sql,/USING OLD\.id/);
 assert.match(sql,/ERRCODE='23514'/);
 assert.doesNotMatch(sql,/DISABLE TRIGGER|DROP CONSTRAINT|TRUNCATE TABLE|DELETE FROM/i);
});

test("DB014 retains exact 21 CASCADE edges without weakening existing constraints",()=>{
 const catalog=readFileSync("tests/db014-registered-tenant-catalog-pg.test.mjs","utf8");
 assert.ok(catalog.includes("expectedCascadePairs"),"existing 21-edge catalog inventory must remain");
 assert.match(catalog,/Registered ON DELETE CASCADE edges changed without DB014 retention review/);
});
