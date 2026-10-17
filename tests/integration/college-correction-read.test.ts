import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getCollegeCorrectionRead} from "@/modules/attendance/college-correction-read-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const own:RequestContext={user:{
  id:SEED_IDS.collegeAdminUser,identityUid:"attendance-policy-view",platformStatus:"ACTIVE",systemRoles:[],
},membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...own,membership:{...own.membership!,
  collegeId:SEED_IDS.collegeB,id:SEED_IDS.facultyCollegeBMembership}};
const learner:RequestContext={...own,membership:{...own.membership!,roles:["LEARNER"]}};
const actingSuperAdmin:RequestContext={
  user:{id:SEED_IDS.superAdminUser,identityUid:"super-admin-attendance-corrections",
    platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA},
};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),
  section:randomUUID(),event:randomUUID()};
const label="w-attendance-policy-"+ids.event.slice(0,8);
const dates={from:"2026-10-14",to:"2026-10-14"};

describe.skipIf(!enabled)("College attendance policy correction read PG",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,label]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,label]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,label,ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text)",
      [ids.section,ids.cohort,ids.period,label]);
    await pool.query("INSERT INTO section_schedule_events(id,section_id,title,starts_at,ends_at,status) " +
      "VALUES($1,$2,$3,'2026-10-14T04:00:00Z','2026-10-14T05:00:00Z','SCHEDULED')",
      [ids.event,ids.section,label]);
    await pool.query("INSERT INTO attendance_sessions(schedule_event_id,status,marked_by_user_id,marked_at) " +
      "VALUES($1,'MARKED',$2,now())",[ids.event,SEED_IDS.collegeAdminUser]);
  });
  afterAll(async()=>{
    try{if(pool){
      await pool.query("DELETE FROM attendance_sessions WHERE schedule_event_id=$1",[ids.event]);
      for(const [table,id]of [
        ["section_schedule_events",ids.event],["sections",ids.section],
        ["cohorts",ids.cohort],["programs",ids.program],["academic_periods",ids.period],
      ]as const)await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
      // Never delete append-only audit/history tables.
    }}finally{await pool?.end();await closeDatabaseConnection();}
  });
  it("returns persisted college session and policy with unknown request history",async()=>{
    const data=await getCollegeCorrectionRead(own,dates);
    expect(data.items.map(row=>row.id)).toContain(ids.event);
    expect(data.items.find(row=>row.id===ids.event)?.attendanceStatus).toBe("MARKED");
    expect(data.policy.correctionWindowHours).toBeGreaterThan(0);
    expect(data.correctionRequestHistory).toBeNull();
    const unselected=await getCollegeCorrectionRead(own,{});
    expect(unselected.queried).toBe(false);
  });
  it("COL-attendance-R03 allows only a scoped Super Admin to read college corrections",async()=>{
    const scoped=await getCollegeCorrectionRead(actingSuperAdmin,dates);
    expect(scoped.items.some(row=>row.id===ids.event)).toBe(true);
    const noScope:RequestContext={...actingSuperAdmin,adminScope:null};
    await expect(getCollegeCorrectionRead(noScope,dates)).rejects.toBeDefined();
    const otherScope:RequestContext={...actingSuperAdmin,adminScope:{
      organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB,
    }};
    const other=await getCollegeCorrectionRead(otherScope,dates);
    expect(other.items.some(row=>row.id===ids.event)).toBe(false);
  });
  it("isolates another college; denies forged and learner inputs",async()=>{
    const other=await getCollegeCorrectionRead(foreign,dates);
    expect(other.items.map(row=>row.id)).not.toContain(ids.event);
    await expect(getCollegeCorrectionRead(learner,dates)).rejects.toBeDefined();
    await expect(getCollegeCorrectionRead(own,{...dates,collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  });
});
