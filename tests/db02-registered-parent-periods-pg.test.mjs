import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

if (process.env.DB02_REGISTERED_PARENT_PERIODS !== "YES" || !process.env.TEST_DATABASE_URL)
  throw new Error("DB-005 registered calendar acceptance requires disposable test database");
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 3 });
after(async () => pool.end());
const deptA = "21000000-0000-4000-8000-000000000001";
const deptB = "21000000-0000-4000-8000-000000000002";
async function rollbackOnly(fn) {
  const c = await pool.connect();
  try { await c.query("BEGIN"); try { await fn(c); } finally { await c.query("ROLLBACK"); } }
  finally { c.release(); }
}
async function deny(c, sql, values, reason) {
  await c.query("SAVEPOINT reject_bad_parent");
  await assert.rejects(c.query(sql,values),e=>e.code==="23514" && (reason instanceof RegExp ? reason.test(e.message) : e.message.includes(reason)));
  await c.query("ROLLBACK TO SAVEPOINT reject_bad_parent");
  await c.query("RELEASE SAVEPOINT reject_bad_parent");
}
async function fixture(c) {
  const suffix=randomUUID().slice(0,8);
  const a=(await c.query("SELECT college_id FROM departments WHERE id=$1",[deptA])).rows[0].college_id;
  const b=(await c.query("SELECT college_id FROM departments WHERE id=$1",[deptB])).rows[0].college_id;
  async function period(college,start,end,label){
    return (await c.query("INSERT INTO academic_periods(college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [college,"DB005 "+label+" "+suffix,"D005-"+label+"-"+suffix,start,end])).rows[0].id;
  }
  const first=await period(a,"2025-07-01","2025-12-31","first");
  const second=await period(a,"2026-01-01","2026-06-30","second");
  const foreign=await period(b,"2025-07-01","2025-12-31","foreign");
  const late=await period(a,"2026-07-01","2026-12-31","late");
  const closed=await period(a,"2026-01-01","2026-06-30","closed");
  await c.query("UPDATE academic_periods SET status='CLOSED' WHERE id=$1",[closed]);
  const program=(await c.query("INSERT INTO programs(department_id,name,code,duration_terms) VALUES($1,$2,$3,4) RETURNING id",
    [deptA,"DB005 program "+suffix,"D005-P-"+suffix])).rows[0].id;
  const course=(await c.query("INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",
    [deptA,"DB005 course "+suffix,"D005-C-"+suffix])).rows[0].id;
  return {suffix,first,second,foreign,late,closed,program,course,
    cohort:async()=> (await c.query("INSERT INTO cohorts(program_id,name,code,start_period_id,expected_end_period_id) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [program,"DB005 cohort "+suffix,"D005-B-"+suffix,first,second])).rows[0].id};
}
test("four academic boundary triggers are physically registered",async()=>{
  const names=["db02_cohort_period_scope_guard","db02_section_period_scope_guard",
    "db02_course_offering_period_window_guard","db02_cohort_program_immutable"];
  const res=await pool.query("SELECT tgname,count(*)::integer AS count FROM pg_trigger WHERE NOT tgisinternal AND tgname=ANY($1) GROUP BY tgname",[names]);
  assert.deepEqual(res.rows.map(x=>[x.tgname,x.count]).sort(),names.map(n=>[n,1]).sort());
});
test("cohort start cannot cross college or enter closed period, and parent is immutable",async()=>{
  await rollbackOnly(async c=>{
    const f=await fixture(c);
    const insert="INSERT INTO cohorts(program_id,name,code,start_period_id) VALUES($1,'Bad','bad',$2)";
    await deny(c,insert,[f.program,f.foreign],"must belong to one college");
    await deny(c,insert,[f.program,f.closed],"closed academic period");
    const cohort=await f.cohort();
    await deny(c,"UPDATE cohorts SET start_period_id=$1 WHERE id=$2",[f.second,cohort],"immutable");
    await deny(c,"UPDATE cohorts SET expected_end_period_id=$1 WHERE id=$2",[f.foreign,cohort],"program college");
  });
});
test("section period checks college, status and cohort date window",async()=>{
  await rollbackOnly(async c=>{
    const f=await fixture(c),cohort=await f.cohort();
    const insert="INSERT INTO sections(cohort_id,academic_period_id,name,code) VALUES($1,$2,'A','A')";
    await deny(c,insert,[cohort,f.foreign],"must belong to one college");
    await deny(c,insert,[cohort,f.closed],"closed academic period");
    await deny(c,insert,[cohort,f.late],"inside the cohort period window");
    const good=await c.query(insert,[cohort,f.second]);
    assert.equal(good.rowCount,1);
    await deny(c,"UPDATE cohorts SET expected_end_period_id=$1 WHERE id=$2",[f.first,cohort],"exclude existing academic state");
  });
});
test("offering period cannot escape cohort window or enter closed period",async()=>{
  await rollbackOnly(async c=>{
    const f=await fixture(c),cohort=await f.cohort();
    const insert="INSERT INTO course_offerings(course_id,cohort_id,academic_period_id) VALUES($1,$2,$3)";
    await deny(c,insert,[f.course,cohort,f.late],"inside cohort window");
    await deny(c,insert,[f.course,cohort,f.closed],/closed academic period|another college or is closed/);
  });
});
