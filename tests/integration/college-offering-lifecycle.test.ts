import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {changeCollegeOfferingLifecycle}
  from "@/modules/courses/college-offering-lifecycle-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"college-offering-lifecycle",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const foreign:RequestContext={...admin,membership:{...admin.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const learner:RequestContext={...admin,membership:{...admin.membership!,roles:["LEARNER"]}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),course:randomUUID(),
  offering:randomUUID(),section:randomUUID(),delivery:randomUUID()};
const label="w-college-offering-"+ids.offering.slice(0,8);

describe.skipIf(!enabled)("College offering archive/restore real PostgreSQL",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,label]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,label]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,label,ids.period]);
    await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3::text,$3::text)",
      [ids.course,SEED_IDS.departmentA,label]);
    await pool.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [ids.offering,ids.course,ids.cohort,ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text)",
      [ids.section,ids.cohort,ids.period,label]);
  });
  afterAll(async()=>{
    try{if(pool){
      await pool.query("DELETE FROM course_section_deliveries WHERE id=$1",[ids.delivery]);
      for(const [table,id] of [
        ["course_offerings",ids.offering],["sections",ids.section],["courses",ids.course],
        ["cohorts",ids.cohort],["programs",ids.program],["academic_periods",ids.period],
      ]as const) {
        if(table==="courses") await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[id]);
        if(table==="programs") await pool.query("DELETE FROM program_terms WHERE program_id=$1",[id]);
        await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
      }
      // Never delete from append-only activity_events.
    }}finally{await pool?.end();await closeDatabaseConnection();}
  });
  it("blocks active delivery, archives, denies stale and restores with audit",async()=>{
    await pool!.query("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
      [ids.delivery,ids.offering,ids.section]);
    await expect(changeCollegeOfferingLifecycle(admin,ids.offering,
      {action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:true}))
      .rejects.toMatchObject({code:"OFFERING_HAS_ACTIVE_DELIVERIES"});
    await pool!.query("UPDATE course_section_deliveries SET ended_at=now() WHERE id=$1",[ids.delivery]);
    const archived=await changeCollegeOfferingLifecycle(admin,ids.offering,
      {action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:true});
    expect(archived.status).toBe("ARCHIVED");
    await expect(changeCollegeOfferingLifecycle(admin,ids.offering,
      {action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:true}))
      .rejects.toMatchObject({code:"OFFERING_STATE_CHANGED"});
    const restored=await changeCollegeOfferingLifecycle(admin,ids.offering,
      {action:"RESTORE",expectedStatus:"ARCHIVED",confirm:true});
    expect(restored.status).toBe("ACTIVE");
    const audit=await pool!.query("SELECT event_type FROM activity_events WHERE subject_type='course_offering' AND subject_id=$1::text",
      [ids.offering]);
    expect(audit.rows.map(row=>row.event_type)).toContain("courses.offering.archived");
    expect(audit.rows.map(row=>row.event_type)).toContain("courses.offering.restored");
  });
  it("conceals foreign and nonexistent offering; rejects roles and forged scope",async()=>{
    await expect(changeCollegeOfferingLifecycle(foreign,ids.offering,
      {action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:true}))
      .rejects.toMatchObject({code:"OFFERING_NOT_FOUND"});
    await expect(changeCollegeOfferingLifecycle(admin,randomUUID(),
      {action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:true}))
      .rejects.toMatchObject({code:"OFFERING_NOT_FOUND"});
    await expect(changeCollegeOfferingLifecycle(learner,ids.offering,
      {action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:true}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(changeCollegeOfferingLifecycle(admin,ids.offering,
      {action:"ARCHIVE",expectedStatus:"ACTIVE",confirm:true,collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
});
