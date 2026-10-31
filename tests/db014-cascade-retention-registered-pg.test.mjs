// DB014 durable cascade retention witness: run only after registered PG17 replay.
// Every write is rolled back; never point at a persistent/shared database.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if(process.env.DB014_STAGED_PG!=="YES")
 throw new Error("DB014 retention witness requires DB014_STAGED_PG=YES");
assertDb018DisposableTarget(process.env,{serviceBound:true});

const parentsAndChildren=[
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
const parentTables=[...new Set(parentsAndChildren.map(x=>x[0]))];
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));

test("DB014 registered retention fences, direct parent deletion and TRUNCATE are fail-closed",async()=>{
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
   connectionTimeoutMillis:10000,query_timeout:15000});
 await db.connect();
 let open=false;
 try{
   const version=Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
   assert.ok(version>=170000&&version<180000,"requires disposable PostgreSQL 17");
   assert.ok(journal.entries.some(x=>x.tag==="0325_db014_cascade_retention_fences"));
   const applied=Number((await db.query(
     "SELECT count(*)::integer AS n FROM drizzle.__drizzle_migrations")).rows[0].n);
   assert.equal(applied,journal.entries.length,"registered zero-to-head replay required");
   const rows=(await db.query(
     "SELECT c.relname AS parent,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid) AS definition "+
     "FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid "+
     "JOIN pg_namespace n ON n.oid=c.relnamespace "+
     "WHERE n.nspname='public' AND NOT t.tgisinternal AND "+
     "(t.tgname LIKE 'db14_cascade_retention_%' OR t.tgname LIKE 'db14_truncate_retention_%') "+
     "ORDER BY t.tgname")).rows;
   assert.equal(rows.length,parentsAndChildren.length+parentTables.length);
   const byName=new Map(rows.map(x=>[x.tgname,x]));
   // A matching trigger is not useful if its source list drifts away from
   // the actual registered CASCADE columns. Read pg_catalog instead of
   // treating historical snapshot 0040 as current.
   const edgeRows=(await db.query(
     "SELECT child.relname AS child_table, parent.relname AS parent_table,"+
     " child_att.attname AS child_column, parent_att.attname AS parent_column,"+
     " fk.convalidated AS validated, fk.confdeltype AS delete_action "+
     "FROM pg_constraint fk "+
     "JOIN pg_class child ON child.oid=fk.conrelid "+
     "JOIN pg_class parent ON parent.oid=fk.confrelid "+
     "JOIN pg_namespace n ON n.oid=child.relnamespace "+
     "JOIN pg_attribute child_att ON child_att.attrelid=fk.conrelid "+
     " AND child_att.attnum=fk.conkey[1] "+
     "JOIN pg_attribute parent_att ON parent_att.attrelid=fk.confrelid "+
     " AND parent_att.attnum=fk.confkey[1] "+
     "WHERE fk.contype='f' AND n.nspname='public' "+
     " AND cardinality(fk.conkey)=1"
   )).rows;
   for(const [parent,child,column] of parentsAndChildren){
     const matched=edgeRows.filter(fk=>fk.child_table===child&&
       fk.parent_table===parent&&fk.child_column===column&&
       fk.parent_column==="id"&&fk.delete_action==="c"&&fk.validated===true);
     assert.ok(matched.length>=1,
       "registered FK shape must match protected relation "+child+"."+column+" -> "+parent+".id");
   }

   for(const [i,[parent,child,fk]] of parentsAndChildren.entries()){
     const name="db14_cascade_retention_"+String(i+1).padStart(2,"0");
     const r=byName.get(name);
     assert.ok(r,"missing registered delete retention guard "+name);
     assert.equal(r.parent,parent);
     assert.ok(r.tgenabled==="O"||r.tgenabled==="A","disabled "+name);
     assert.match(r.definition,/BEFORE DELETE/);
     assert.ok(r.definition.includes("db14_cascade_retention_delete_guard"));
     assert.ok(r.definition.includes(child)&&r.definition.includes(fk),
       "trigger child/fk does not match "+child+"."+fk);
   }
   for(const [i,parent] of parentTables.entries()){
     const name="db14_truncate_retention_"+String(i+1).padStart(2,"0");
     const r=byName.get(name);
     assert.ok(r,"missing registered truncate fence "+name);
     assert.equal(r.parent,parent);
     assert.ok(r.tgenabled==="O"||r.tgenabled==="A");
     assert.match(r.definition,/BEFORE TRUNCATE/);
     assert.ok(r.definition.includes("db14_cascade_retention_truncate_guard"));
   }
   await db.query("BEGIN");
   open=true;
   const suffix=randomUUID().replaceAll("-","").slice(0,12);
   const p="db014_retain_probe_parent_"+suffix;
   const c="db014_retain_probe_child_"+suffix;
   await db.query('CREATE TABLE public."'+p+'" (id uuid PRIMARY KEY)');
   await db.query('CREATE TABLE public."'+c+'" (parent_id uuid REFERENCES public."'+p+'"(id) ON DELETE CASCADE)');
   await db.query('CREATE TRIGGER db014_retain_probe BEFORE DELETE ON public."'+p+
     '" FOR EACH ROW EXECUTE FUNCTION db14_cascade_retention_delete_guard(\''+c+'\',\'parent_id\')');
   await db.query('CREATE TRIGGER db014_truncate_probe BEFORE TRUNCATE ON public."'+p+
     '" FOR EACH STATEMENT EXECUTE FUNCTION db14_cascade_retention_truncate_guard()');
   const parentId=randomUUID();
   await db.query('INSERT INTO public."'+p+'"(id) VALUES ($1)',[parentId]);
   await db.query('INSERT INTO public."'+c+'"(parent_id) VALUES ($1)',[parentId]);
   await db.query("SAVEPOINT db014_protected");
   await assert.rejects(db.query('DELETE FROM public."'+p+'" WHERE id=$1',[parentId]),e=>{
     assert.equal(e?.code,"23514");assert.match(e.message,/DB014 retention forbids deleting/);return true;});
   await db.query("ROLLBACK TO SAVEPOINT db014_protected");
   assert.equal((await db.query('SELECT count(*)::int AS n FROM public."'+c+'"')).rows[0].n,1,
     "retained child must not disappear on a rejected parent delete");
   await db.query("SAVEPOINT db014_truncate");
   await assert.rejects(db.query('TRUNCATE TABLE public."'+p+'" CASCADE'),e=>{
     assert.equal(e?.code,"23514");assert.match(e.message,/DB014 retention forbids TRUNCATE/);return true;});
   await db.query("ROLLBACK TO SAVEPOINT db014_truncate");
   const removedChild=await db.query('DELETE FROM public."'+c+'" WHERE parent_id=$1',[parentId]);
   assert.equal(removedChild.rowCount,1,"explicit child lifecycle is not changed");
   const removedParent=await db.query('DELETE FROM public."'+p+'" WHERE id=$1',[parentId]);
   assert.equal(removedParent.rowCount,1,"empty draft parent remains hard-deletable");

   // Live-schema witness, not just a synthetic trigger: a legitimately targeted
   // broadcast must never vanish through its configured CASCADE relationship.
   const broadcastId=randomUUID();
   const seededAdmin="30000000-0000-4000-8000-000000000002";
   const seededCollege="20000000-0000-4000-8000-000000000001";
   await db.query(
     "INSERT INTO platform_broadcasts (id,title,message,show_until,audience_mode,status,author_user_id) "+
     "VALUES ($1,'DB014 retention','PG17 negative',now() + interval '1 day',"+
     "'SELECTED_COLLEGES','PUBLISHED',$2)",[broadcastId,seededAdmin]);
   await db.query("INSERT INTO platform_broadcast_targets(broadcast_id,college_id) VALUES ($1,$2)",
     [broadcastId,seededCollege]);
   await db.query("SAVEPOINT db014_live_broadcast");
   await assert.rejects(db.query("DELETE FROM platform_broadcasts WHERE id=$1",[broadcastId]),e=>{
     assert.equal(e?.code,"23514");assert.match(e.message,/DB014 retention forbids deleting/);return true;
   });
   await db.query("ROLLBACK TO SAVEPOINT db014_live_broadcast");
   assert.equal((await db.query(
     "SELECT count(*)::int AS n FROM platform_broadcast_targets WHERE broadcast_id=$1",
     [broadcastId])).rows[0].n,1,"real platform broadcast target must survive rejected parent DELETE");
   await db.query("DELETE FROM platform_broadcast_targets WHERE broadcast_id=$1",[broadcastId]);
   assert.equal((await db.query("DELETE FROM platform_broadcasts WHERE id=$1",[broadcastId])).rowCount,1,
     "target-free broadcast parent remains deletable");

   await db.query("ROLLBACK");open=false;
   console.log(JSON.stringify({kind:"DB014_RETENTION_GATES",registered:parentsAndChildren.length,
     truncateFences:parentTables.length,negativeDelete:"23514",negativeTruncate:"23514",
     deliberateEmptyParentDelete:"PASS",journalHead:journal.entries.at(-1).tag,rollback:true}));
 }finally{
   if(open)await db.query("ROLLBACK").catch(()=>{});
   await db.end();
 }
});

/**
 * DB014 concurrent FK child insert and parent deletion:
 * - a child insert holds a KEY SHARE lock on the referenced parent;
 * - a concurrent parent DELETE must wait, not race past the retention probe;
 * - after the child commits, the retention guard must reject the DELETE;
 * - if the DELETE obtains the parent row lock first, a racing child insert
 *   cannot commit a dangling reference even if the parent DELETE rolls back.
 *
 * This is a REAL registered-table witness, not a synthetic trigger check.
 * Use a seeded, disposable PG17 database only; every fixture is cleaned up.
 */
test("DB014 concurrent FK insert and retained-parent DELETE serialize in both orders",async()=>{
 const parent=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
   connectionTimeoutMillis:10000,query_timeout:15000});
 const child=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,
   connectionTimeoutMillis:10000,query_timeout:15000});
 await parent.connect();
 await child.connect();
 const seededAdmin="30000000-0000-4000-8000-000000000002";
 const seededCollege="20000000-0000-4000-8000-000000000001";
 const ids=[randomUUID(),randomUUID()];
 let parentTx=false,childTx=false;
 try{
   for(const id of ids){
     await parent.query(
       "INSERT INTO platform_broadcasts (id,title,message,show_until,audience_mode,status,author_user_id) "+
       "VALUES ($1,'DB014 retention race','PG17 two-session witness',now() + interval '1 day',"+
       "'SELECTED_COLLEGES','PUBLISHED',$2)",[id,seededAdmin]);
   }

   // Child first: its FK KEY SHARE must prevent the parent from slipping past
   // retention before an uncommitted target becomes visible.
   await child.query("BEGIN");childTx=true;
   await child.query(
     "INSERT INTO platform_broadcast_targets(broadcast_id,college_id) VALUES ($1,$2)",
     [ids[0],seededCollege]);
   await parent.query("BEGIN");parentTx=true;
   await parent.query("SET LOCAL lock_timeout='400ms'");
   await assert.rejects(parent.query(
     "DELETE FROM platform_broadcasts WHERE id=$1",[ids[0]]),error=>{
     assert.equal(error?.code,"55P03","DELETE must wait for child FK transaction");
     return true;
   });
   await parent.query("ROLLBACK");parentTx=false;
   await child.query("COMMIT");childTx=false;
   await parent.query("BEGIN");parentTx=true;
   await parent.query("SAVEPOINT db014_retained_after_commit");
   await assert.rejects(parent.query(
     "DELETE FROM platform_broadcasts WHERE id=$1",[ids[0]]),error=>{
     assert.equal(error?.code,"23514","committed target must be retained");
     return true;
   });
   await parent.query("ROLLBACK TO SAVEPOINT db014_retained_after_commit");
   assert.equal((await parent.query(
     "SELECT count(*)::int AS n FROM platform_broadcast_targets WHERE broadcast_id=$1",
     [ids[0]])).rows[0].n,1);
   await parent.query("COMMIT");parentTx=false;

   // Parent first: a DELETE of a target-free draft parent takes the row lock.
   // A concurrent child insert must not bypass that in-flight deletion.
   await parent.query("BEGIN");parentTx=true;
   const deletion=await parent.query(
     "DELETE FROM platform_broadcasts WHERE id=$1",[ids[1]]);
   assert.equal(deletion.rowCount,1,"target-free parent is deletable");
   await child.query("BEGIN");childTx=true;
   await child.query("SET LOCAL lock_timeout='400ms'");
   await assert.rejects(child.query(
     "INSERT INTO platform_broadcast_targets(broadcast_id,college_id) VALUES ($1,$2)",
     [ids[1],seededCollege]),error=>{
     assert.equal(error?.code,"55P03","child FK must wait for parent deletion");
     return true;
   });
   await child.query("ROLLBACK");childTx=false;
   await parent.query("ROLLBACK");parentTx=false;

   // Rollback restored the parent; it may now accept a child, which must
   // again block deletion through the registered retention guard.
   await child.query(
     "INSERT INTO platform_broadcast_targets(broadcast_id,college_id) VALUES ($1,$2)",
     [ids[1],seededCollege]);
   await parent.query("BEGIN");parentTx=true;
   await parent.query("SAVEPOINT db014_restored_parent");
   await assert.rejects(parent.query(
     "DELETE FROM platform_broadcasts WHERE id=$1",[ids[1]]),error=>{
     assert.equal(error?.code,"23514");
     return true;
   });
   await parent.query("ROLLBACK TO SAVEPOINT db014_restored_parent");
   await parent.query("COMMIT");parentTx=false;
   for(const id of ids){
     await parent.query("DELETE FROM platform_broadcast_targets WHERE broadcast_id=$1",[id]);
     assert.equal((await parent.query(
       "DELETE FROM platform_broadcasts WHERE id=$1",[id])).rowCount,1);
   }
   console.log(JSON.stringify({kind:"DB014_CASCADE_RETENTION_RACES",
     childFirstWait:"55P03",childCommittedDeleteRejected:"23514",
     parentFirstWait:"55P03",restoredParentProtected:"23514",
     allFixturesDeleted:true,registeredSchema:true}));
 }finally{
   if(childTx)await child.query("ROLLBACK").catch(()=>{});
   if(parentTx)await parent.query("ROLLBACK").catch(()=>{});
   await child.end().catch(()=>{});
   await parent.end().catch(()=>{});
 }
});
