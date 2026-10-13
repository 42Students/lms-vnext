import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

if (process.env.DB02_REGISTERED_CURRICULUM !== "YES" || !process.env.TEST_DATABASE_URL) {
 throw new Error("DB02 curriculum PG acceptance requires an explicit disposable database");
}
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL,max:2});
after(async()=>pool.end());
const a="21000000-0000-4000-8000-000000000001";
const b="21000000-0000-4000-8000-000000000002";
async function rollbackOnly(fn){
 const client=await pool.connect();
 try {await client.query("BEGIN");try{await fn(client);}finally{await client.query("ROLLBACK");}}
 finally{client.release();}
}
async function rejectSql(client,sql,params,code,match){
 await client.query("SAVEPOINT deny");
 await assert.rejects(client.query(sql,params),e=>e.code===code&&(!match||e.message.includes(match)));
 await client.query("ROLLBACK TO SAVEPOINT deny");await client.query("RELEASE SAVEPOINT deny");
}
async function fixture(client){
 const suffix=randomUUID().slice(0,8);
 const program=(await client.query(
  "INSERT INTO programs(department_id,name,code,duration_terms) VALUES($1,$2,$3,4) RETURNING id",
  [a,"DB02 curriculum "+suffix,"D2P-"+suffix])).rows[0].id;
 const course=(await client.query(
  "INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",
  [a,"DB02 course "+suffix,"D2C-"+suffix])).rows[0].id;
 const foreignCourse=(await client.query(
  "INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",
  [b,"DB02 foreign course "+suffix,"D2F-"+suffix])).rows[0].id;
 return {program,course,foreignCourse};
}
test("registered DB02 exposes two curriculum tables, FKs, and ownership triggers",async()=>{
 const got=await pool.query(`SELECT tgrelid::regclass::text AS table_name,tgname
 FROM pg_trigger WHERE NOT tgisinternal AND tgname IN
 ('db02_program_term_bounds_guard','db02_program_term_identity_immutable',
 'db02_program_term_course_tenant','db02_program_term_course_identity_guard',
 'db02_program_duration_term_floor') ORDER BY tgname`);
 assert.equal(got.rows.length,5);
 for(const name of ["program_terms","program_term_courses"]){
   const t=await pool.query("SELECT to_regclass($1)::text AS table_name",[name]);
   assert.equal(t.rows[0].table_name,name);
 }
});
test("semester term respects program duration and stable parent identity",async()=>{
 await rollbackOnly(async c=>{
  const {program}=await fixture(c);
  const term=(await c.query(
    "INSERT INTO program_terms(program_id,term_number,name) VALUES($1,1,'Semester 1') RETURNING id",
    [program])).rows[0].id;
  await rejectSql(c,"INSERT INTO program_terms(program_id,term_number,name) VALUES($1,1,'Again')",
   [program],"23505","program_terms_program_number_uq");
  await rejectSql(c,"INSERT INTO program_terms(program_id,term_number,name) VALUES($1,5,'Too many')",
   [program],"23514","exceeds configured program duration");
  await rejectSql(c,"UPDATE program_terms SET term_number=2 WHERE id=$1",[term],"23514","identity is immutable");
  await rejectSql(c,"UPDATE programs SET duration_terms=0 WHERE id=$1",[program],"23514");
  await c.query("INSERT INTO program_terms(program_id,term_number,name) VALUES($1,4,'Semester 4')",[program]);
  await rejectSql(c,"UPDATE programs SET duration_terms=2 WHERE id=$1",[program],"23514","Cannot shorten program");
 });
});
test("curriculum accepts same college, zero credits, and rejects foreign college",async()=>{
 await rollbackOnly(async c=>{
  const {program,course,foreignCourse}=await fixture(c);
  const term=(await c.query(
   "INSERT INTO program_terms(program_id,term_number,name) VALUES($1,1,'Semester 1') RETURNING id",
   [program])).rows[0].id;
  const m=(await c.query(
   "INSERT INTO program_term_courses(program_term_id,course_id,type,credits,display_order) VALUES($1,$2,'CORE',0,1) RETURNING id",
   [term,course])).rows[0].id;
  await rejectSql(c,
   "INSERT INTO program_term_courses(program_term_id,course_id,display_order) VALUES($1,$2,2)",
   [term,foreignCourse],"23514","must belong to the same college");
  await rejectSql(c,
   "INSERT INTO program_term_courses(program_term_id,course_id,display_order) VALUES($1,$2,2)",
   [term,course],"23505","program_term_courses_term_course_uq");
  await rejectSql(c,"UPDATE program_term_courses SET course_id=$1 WHERE id=$2",
   [foreignCourse,m],"23514","must belong to the same college");
  await rejectSql(c,"UPDATE program_term_courses SET display_order=0 WHERE id=$1",
   [m],"23514");
  const val=await c.query("SELECT credits,display_order FROM program_term_courses WHERE id=$1",[m]);
  assert.equal(val.rows[0].credits,0);assert.equal(val.rows[0].display_order,1);
 });
});
test("curriculum ownership cannot be changed by same-college identity rewrite",async()=>{
 await rollbackOnly(async c=>{
  const {program,course}=await fixture(c);
  const term1=(await c.query(
   "INSERT INTO program_terms(program_id,term_number,name) VALUES($1,1,'Semester 1') RETURNING id",
   [program])).rows[0].id;
  const term2=(await c.query(
   "INSERT INTO program_terms(program_id,term_number,name) VALUES($1,2,'Semester 2') RETURNING id",
   [program])).rows[0].id;
  const row=(await c.query(
   "INSERT INTO program_term_courses(program_term_id,course_id,display_order) VALUES($1,$2,1) RETURNING id",
   [term1,course])).rows[0].id;
  await rejectSql(c,"UPDATE program_term_courses SET program_term_id=$1 WHERE id=$2",
   [term2,row],"23514","identity is immutable");
 });
});
