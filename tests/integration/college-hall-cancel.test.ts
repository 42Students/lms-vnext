import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {cancelCollegeHallBooking}
  from "@/modules/academics/college-hall-cancel-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"hall-cancel-test",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...admin,membership:{...admin.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const learner:RequestContext={...admin,membership:{...admin.membership!,roles:["LEARNER"]}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),
  section:randomUUID(),hall:randomUUID(),event:randomUUID()};
const tag="w-cancel-"+ids.event.slice(0,8);
let token="";
const request=()=>({expectedUpdatedAt:token,reason:"Schedule changed",confirm:true});
describe.skipIf(!enabled)("College hall cancellation PG guard",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,tag]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,tag]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,tag,ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text)",
      [ids.section,ids.cohort,ids.period,tag]);
    await pool.query("INSERT INTO lecture_halls(id,college_id,name,capacity,room_type) VALUES($1,$2,$3,30,'CLASSROOM')",
      [ids.hall,SEED_IDS.collegeA,tag]);
    const future=new Date(Date.now()+72*3600*1000),end=new Date(future.getTime()+3600000);
    const saved=await pool.query<{updated_at:Date}>("INSERT INTO section_schedule_events(id,section_id,lecture_hall_id,title,starts_at,ends_at) VALUES($1,$2,$3,$4::text,$5,$6) RETURNING updated_at",
      [ids.event,ids.section,ids.hall,tag,future,end]);
    token=saved.rows[0]!.updated_at.toISOString();
  });
  afterAll(async()=>{try{if(pool){
    await pool.query("DELETE FROM attendance_sessions WHERE schedule_event_id=$1",[ids.event]);
    await pool.query("DELETE FROM section_schedule_events WHERE id=$1",[ids.event]);
    await pool.query("DELETE FROM lecture_halls WHERE id=$1",[ids.hall]);
    for(const [table,id] of [["sections",ids.section],["cohorts",ids.cohort],
      ["programs",ids.program],["academic_periods",ids.period]] as const)
      await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
    // Never delete append-only activity_events.
  }}finally{await pool?.end();await closeDatabaseConnection();}});
  it("denies cross-college and wrong role; protects stale and attendance evidence, audits success",async()=>{
    await expect(cancelCollegeHallBooking(foreign,ids.hall,ids.event,request()))
      .rejects.toMatchObject({code:"HALL_SESSION_NOT_FOUND"});
    await expect(cancelCollegeHallBooking(learner,ids.hall,ids.event,request()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(cancelCollegeHallBooking(admin,ids.hall,ids.event,{...request(),collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    const stale=new Date(Date.parse(token)-60000).toISOString();
    await expect(cancelCollegeHallBooking(admin,ids.hall,ids.event,{
      ...request(),expectedUpdatedAt:stale,
    })).rejects.toMatchObject({code:"HALL_SESSION_STALE"});
    await pool!.query("INSERT INTO attendance_sessions(schedule_event_id) VALUES($1)",[ids.event]);
    await expect(cancelCollegeHallBooking(admin,ids.hall,ids.event,request()))
      .rejects.toMatchObject({code:"HALL_SESSION_HAS_EVIDENCE"});
    await pool!.query("DELETE FROM attendance_sessions WHERE schedule_event_id=$1",[ids.event]);
    const cancelled=await cancelCollegeHallBooking(admin,ids.hall,ids.event,request());
    expect(cancelled.status).toBe("CANCELLED");
    await expect(cancelCollegeHallBooking(admin,ids.hall,ids.event,request()))
      .rejects.toMatchObject({code:"HALL_SESSION_STALE"});
    const evidence=await pool!.query("SELECT summary FROM activity_events WHERE subject_type='section' AND subject_id=$1::text",[ids.section]);
    expect(evidence.rows.map(row=>row.summary))
      .toContain("College Admin cancelled a scheduled lecture hall session");
  });
});
