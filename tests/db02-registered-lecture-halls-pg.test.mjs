import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

if (process.env.DB02_REGISTERED_HALLS !== "YES" || !process.env.TEST_DATABASE_URL)
  throw new Error("Registered hall PostgreSQL witness requires explicit disposable opt-in");
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL,max:2});
after(async()=>pool.end());
const a="21000000-0000-4000-8000-000000000001";
const b="21000000-0000-4000-8000-000000000002";
async function rollbackOnly(fn){
 const db=await pool.connect();
 try {await db.query("BEGIN");try{await fn(db);}finally{await db.query("ROLLBACK");}}
 finally{db.release();}
}
async function deny(db,sql,params,code,part){
 await db.query("SAVEPOINT denied");
 await assert.rejects(db.query(sql,params),e=>e.code===code && (!part||e.message.includes(part)));
 await db.query("ROLLBACK TO SAVEPOINT denied");
 await db.query("RELEASE SAVEPOINT denied");
}
async function fixture(db) {
 const suffix=randomUUID().slice(0,8);
 const colleges=(await db.query("SELECT id,college_id FROM departments WHERE id=ANY($1::uuid[])",[[a,b]])).rows;
 const collegeA=colleges.find(x=>x.id===a).college_id,collegeB=colleges.find(x=>x.id===b).college_id;
 const period=(await db.query("INSERT INTO academic_periods(college_id,name,code,start_date,end_date) VALUES($1,$2,$3,'2027-08-01','2028-07-31') RETURNING id",
 [collegeA,"DB005 academic "+suffix,"D5S-"+suffix])).rows[0].id;
 const program=(await db.query("INSERT INTO programs(department_id,name,code,duration_terms) VALUES($1,$2,$3,4) RETURNING id",
 [a,"DB005 program "+suffix,"D5P-"+suffix])).rows[0].id;
 const cohort=(await db.query("INSERT INTO cohorts(program_id,name,code,start_period_id) VALUES($1,$2,$3,$4) RETURNING id",
 [program,"DB005 cohort "+suffix,"D5B-"+suffix,period])).rows[0].id;
 const section=(await db.query("INSERT INTO sections(cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4) RETURNING id",
 [cohort,period,"DB005 section "+suffix,"D5C-"+suffix])).rows[0].id;
 return {collegeA,collegeB,period,program,cohort,section,suffix};
}
test("0052 registers hall, timetable FK and three overlap exclusion constraints",async()=>{
 const room=await pool.query("SELECT to_regclass('lecture_halls')::text AS name");
 assert.equal(room.rows[0].name,"lecture_halls");
 const col=await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='section_schedule_events' AND column_name='lecture_hall_id'");
 assert.equal(col.rows.length,1);
 const exclusions=await pool.query("SELECT conname FROM pg_constraint WHERE contype='x' AND conname LIKE 'section_schedule_events_%_no_overlap_excl' ORDER BY conname");
 assert.deepEqual(exclusions.rows.map(x=>x.conname),["section_schedule_events_faculty_no_overlap_excl","section_schedule_events_hall_no_overlap_excl","section_schedule_events_section_no_overlap_excl"]);
 const trigger=await pool.query(`SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname IN
 ('db02_lecture_hall_department_guard','db02_schedule_hall_tenant_guard','db02_lecture_hall_archive_guard',
 'db02_section_faculty_assignment_scope_guard','db02_course_teaching_assignment_scope_guard')`);
 assert.equal(trigger.rows.length,5);
});
test("registered hall cannot be linked to a foreign college or duplicated within one college",async()=>{
 await rollbackOnly(async db=>{
 const {collegeA,collegeB,suffix}=await fixture(db);
 const hall=(await db.query("INSERT INTO lecture_halls(college_id,department_id,name,capacity,room_type) VALUES($1,$2,$3,80,'LECTURE_HALL') RETURNING id",
 [collegeA,a,"DB005 Hall "+suffix])).rows[0].id;
 await deny(db,"INSERT INTO lecture_halls(college_id,department_id,name,capacity,room_type) VALUES($1,$2,$3,10,'CLASSROOM')",
 [collegeB,a,"DB005 wrong "+suffix],"23514","same college");
 await deny(db,"INSERT INTO lecture_halls(college_id,department_id,name,capacity,room_type) VALUES($1,$2,$3,40,'CLASSROOM')",
 [collegeA,a,("db005 hall "+suffix)],"23505","lecture_halls_active_college_name_uq");
 assert.ok(hall);
 });
});
test("registered timetable rejects overlaps but permits [start,end) back-to-back slots",async()=>{
 await rollbackOnly(async db=>{
 const {collegeA,section,suffix}=await fixture(db);
 const hall=(await db.query("INSERT INTO lecture_halls(college_id,department_id,name,capacity,room_type) VALUES($1,$2,$3,80,'CLASSROOM') RETURNING id",
 [collegeA,a,"DB005 Hall "+suffix])).rows[0].id;
 const insert="INSERT INTO section_schedule_events(section_id,lecture_hall_id,title,starts_at,ends_at) VALUES($1,$2,'DB005 lecture',$3,$4)";
 await db.query(insert,[section,hall,"2027-09-14T10:00:00Z","2027-09-14T11:00:00Z"]);
 await deny(db,insert,[section,hall,"2027-09-14T10:30:00Z","2027-09-14T11:30:00Z"],"23P01");
 await db.query(insert,[section,hall,"2027-09-14T11:00:00Z","2027-09-14T12:00:00Z"]);
 await deny(db,"UPDATE lecture_halls SET status='ARCHIVED' WHERE id=$1",[hall],"23514","Cannot archive lecture hall");
 });
});
