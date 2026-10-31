// DB020 registered 10 SQL-only tables remain physically authoritative.
// Exact catalog: https://github.com/42Students/lms-vnext/actions/runs/41151964447
// Hashing all nonvolatile schema metadata ensures that the 0327 canonical
// Drizzle snapshot baseline cannot conceal SQL-only DDL regression.
import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const typed=read(".verification/db020-current-typed-snapshot.json");
const pg=read(".verification/db020-registered-catalog-full.json");
const diagnosis=read(".verification/db020-catalog-disposition.json");
const expectedTables=[
 "lesson_content_delivery_sequences","lesson_content_discussions",
 "placement_application_legacy_auto_screening",
 "placement_application_legacy_status_history",
 "placement_job_diversity_outreach","placement_recruiter_selection_items",
 "placement_recruiter_selection_lists","placement_tpo_company_thread_messages",
 "placement_tpo_company_threads","scheduled_job_leases"
];
const expected={
 columns:{count:106,hash:"676eba2609d96b178e820f2f47696338f43b6ec2779ed6302a14f46ec0ee9894",
  fields:["table_name","column_name","data_type","not_null","default_expression","identity_mode","generated_mode"]},
 constraints:{count:68,hash:"2ad80df60a054d41cd317042687545d2467488d45d70b440a807a2fde6bc8b0f",
  fields:["table_name","name","type","validated","deferrable","initially_deferred","definition"]},
 indexes:{count:33,hash:"5a8c2abf7d76166a5de4cf8a9863e667d079e16b4315a5b13d4ab171eac2943e",
  fields:["table_name","name","unique","primary","valid","definition"]},
 triggers:{count:3,hash:"0a6b9f6b5e535dda6810b012b10457b4375544f516df662a763853e03488d1b4",
  fields:["table_name","name","enabled","definition"]}
};
test("DB020 10 SQL-only tables are independently present and catalogued",()=>{
 assert.equal(pg.kind,"DB020_EXACT_REGISTERED_PG17_CATALOG");
 assert.equal(pg.registeredMigrations,diagnosis.registeredMigrations);
 assert.equal(pg.registeredHead,diagnosis.registeredHead);
 assert.ok(pg.registeredMigrations>=329,"require registered 0328+ PG17");
 assert.equal(diagnosis.passCertification,false);
 const represented=new Set(Object.keys(typed.tables).map(x=>x.replace(/^public\./,"")));
 const sqlOnly=pg.tables.map(x=>x.name).filter(x=>!represented.has(x)).sort();
 assert.deepEqual(sqlOnly,expectedTables);
 assert.equal(diagnosis.counts.registeredSqlOnlyTables,expectedTables.length);
});
for(const [kind,contract] of Object.entries(expected)){
 test("DB020 SQL-only "+kind+" exact schema contract cannot silently drift",()=>{
  const rows=pg[kind].filter(x=>expectedTables.includes(x.table_name))
   .map(x=>contract.fields.map(f=>x[f]??null))
   .sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  assert.equal(rows.length,contract.count,kind+" count changed");
  const digest=createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  assert.equal(digest,contract.hash,kind+" SQL-only schema changed; review before DB020 phase gate");
  if(kind==="constraints")assert.ok(pg[kind].filter(x=>expectedTables.includes(x.table_name))
   .every(x=>x.validated===true),"no unvalidated SQL-only constraint");
  if(kind==="indexes")assert.ok(pg[kind].filter(x=>expectedTables.includes(x.table_name))
   .every(x=>x.valid===true),"no invalid SQL-only index");
  if(kind==="triggers")assert.ok(pg[kind].filter(x=>expectedTables.includes(x.table_name))
   .every(x=>["O","A"].includes(x.enabled)),"no disabled SQL-only trigger");
 });
}
