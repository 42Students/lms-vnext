import { randomUUID } from "node:crypto";
import { beforeAll,afterAll,describe,expect,it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { executeCollegeRecurringSchedule,CollegeRecurringExecutionError }
  from "@/modules/academics/college-recurring-execute-service";
import {previewCollegeRecurringSchedule,RecurringPreviewNotFoundError}
  from "@/modules/academics/college-recurring-preview-service";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const own:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"repeat-execute-test",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...own,membership:{...own.membership!,collegeId:SEED_IDS.collegeB,
  id:SEED_IDS.facultyCollegeBMembership}};
const learner:RequestContext={...own,membership:{...own.membership!,roles:["LEARNER"]}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),section:randomUUID()};
const name="w-repeat-"+ids.section.slice(0,8);
let token="";
const request=()=>({sectionId:ids.section,from:"2026-10-15",to:"2026-10-15",
  weekdays:[4],startTime:"09:00",endTime:"10:00",title:name,expectedSectionUpdatedAt:token,confirm:true});
describe.skipIf(!enabled)("College recurring execute PostgreSQL",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,name]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,name]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,name,ids.period]);
    const inserted=await pool.query<{updated_at:Date}>(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text) RETURNING updated_at",
      [ids.section,ids.cohort,ids.period,name]);
    token=inserted.rows[0]!.updated_at.toISOString();
  });
  afterAll(async()=>{try{if(pool){
    await pool.query("DELETE FROM section_schedule_events WHERE section_id=$1",[ids.section]);
    for(const [table,id] of [["sections",ids.section],["cohorts",ids.cohort],
      ["programs",ids.program],["academic_periods",ids.period]] as const)
      await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
    // Append-only activity_events remain immutable.
  }}finally{await pool?.end();await closeDatabaseConnection();}});
  it("creates a complete recurring series, audits, rejects stale token from SQL now()",async()=>{
    const created=await executeCollegeRecurringSchedule(own,request());
    expect(created.created).toBe(1);
    const rows=await pool!.query("SELECT id FROM section_schedule_events WHERE section_id=$1",[ids.section]);
    expect(rows.rowCount).toBe(1);
    await expect(executeCollegeRecurringSchedule(own,request()))
      .rejects.toMatchObject({code:"STALE_SECTION"});
    const audit=await pool!.query("SELECT id FROM activity_events WHERE subject_type='section' AND subject_id=$1::text AND summary='College Admin created recurring class sessions'",[ids.section]);
    expect(audit.rowCount).toBe(1);
  });
  it("conceals foreign scope, denies wrong role and forged college id",async()=>{
    await expect(executeCollegeRecurringSchedule(foreign,request()))
      .rejects.toBeInstanceOf(CollegeRecurringExecutionError);
    await expect(executeCollegeRecurringSchedule(learner,request()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(executeCollegeRecurringSchedule(own,{...request(),collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
  it("rejects recurring preview and execution once the period is closed",async()=>{
    const latest=await pool!.query<{updated_at:Date}>(
      "SELECT updated_at FROM sections WHERE id=$1",[ids.section]);
    token=latest.rows[0]!.updated_at.toISOString();
    const before=await pool!.query<{total:string}>(
      "SELECT count(*)::text AS total FROM section_schedule_events WHERE section_id=$1",[ids.section]);
    const next={...request(),startTime:"11:00",endTime:"12:00"};
    const {sectionId,from,to,weekdays,startTime,endTime}=next;
    await pool!.query("UPDATE academic_periods SET status='CLOSED' WHERE id=$1",[ids.period]);
    try {
      await expect(previewCollegeRecurringSchedule(own,
        {sectionId,from,to,weekdays,startTime,endTime}))
        .rejects.toBeInstanceOf(RecurringPreviewNotFoundError);
      await expect(executeCollegeRecurringSchedule(own,next))
        .rejects.toMatchObject({code:"NOT_FOUND"});
      const after=await pool!.query<{total:string}>(
        "SELECT count(*)::text AS total FROM section_schedule_events WHERE section_id=$1",[ids.section]);
      expect(after.rows[0]?.total).toBe(before.rows[0]?.total);
    } finally {
      await pool!.query("UPDATE academic_periods SET status='PLANNED' WHERE id=$1",[ids.period]);
    }
  });
});
