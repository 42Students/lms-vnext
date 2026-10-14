import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  changeCollegePeriodLifecycle,
} from "@/modules/academics/college-period-lifecycle-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, {serviceBound: true});
const pool = enabled ? new Pool({connectionString: process.env.TEST_DATABASE_URL,max:2}) : null;
const admin: RequestContext = {
  user: {id: SEED_IDS.collegeAdminUser, identityUid:"period-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership: {id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const foreign: RequestContext = {
  user: {...admin.user,id:SEED_IDS.facultyUser},
  membership: {id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const wrongRole: RequestContext = {
  ...admin,membership:{...admin.membership!,roles:["FACULTY"]},
};
const ids = { freePeriod:randomUUID(), blockedPeriod:randomUUID(),
  program:randomUUID(), cohort:randomUUID(), section:randomUUID() };
const label = "W-Period-"+ids.freePeriod.slice(0,8);

describe.skipIf(!enabled)("Academic period lifecycle PostgreSQL",()=>{
  beforeAll(async ()=>{
    if(!pool)throw new Error("Disposable PG required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31','ACTIVE')",
      [ids.freePeriod,SEED_IDS.collegeA,label,label]);
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status) VALUES($1,$2,$3,$4,'2027-01-01','2027-06-30','ACTIVE')",
      [ids.blockedPeriod,SEED_IDS.collegeA,label+"B",label+"B"]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, label,label]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort,ids.program,label,label,ids.blockedPeriod]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [ids.section,ids.cohort,ids.blockedPeriod,label,label]);
  });
  afterAll(async ()=>{
    try {
      if(pool)for(const [table,id] of [
        ["sections",ids.section],["cohorts",ids.cohort],["programs",ids.program],
        ["academic_periods",ids.blockedPeriod],["academic_periods",ids.freePeriod],
      ] as const)await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
    } finally {await pool?.end();await closeDatabaseConnection();}
  });
  it("atomically closes and reopens, auditing both transitions",async()=>{
    const closed=await changeCollegePeriodLifecycle(admin,ids.freePeriod,{action:"CLOSE",confirm:true});
    expect(closed.status).toBe("CLOSED");
    const reopened=await changeCollegePeriodLifecycle(admin,ids.freePeriod,{action:"REOPEN",confirm:true});
    expect(reopened.status).toBe("ACTIVE");
    const events=await pool!.query("SELECT event_type FROM activity_events WHERE subject_id=$1 ORDER BY occurred_at",
      [ids.freePeriod]);
    expect(events.rows.map(x=>x.event_type)).toEqual([
      "academics.period.closed","academics.period.reopened",
    ]);
  });
  it("blocks closure with persisted active section, with no audit mutation",async()=>{
    await expect(changeCollegePeriodLifecycle(admin,ids.blockedPeriod,{action:"CLOSE",confirm:true}))
      .rejects.toMatchObject({code:"PERIOD_HAS_OPEN_SECTIONS"});
    const unchanged=await pool!.query("SELECT status FROM academic_periods WHERE id=$1",[ids.blockedPeriod]);
    expect(unchanged.rows[0].status).toBe("ACTIVE");
    const event=await pool!.query("SELECT count(*)::int AS n FROM activity_events WHERE subject_id=$1",[ids.blockedPeriod]);
    expect(event.rows[0].n).toBe(0);
  });
  it("denies foreign college with non-leaking not-found code and wrong role",async()=>{
    await expect(changeCollegePeriodLifecycle(foreign,ids.freePeriod,{action:"CLOSE",confirm:true}))
      .rejects.toMatchObject({code:"PERIOD_NOT_FOUND"});
    await expect(changeCollegePeriodLifecycle(wrongRole,ids.freePeriod,{action:"CLOSE",confirm:true}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(changeCollegePeriodLifecycle(admin,ids.freePeriod,{action:"CLOSE",confirm:false}))
      .rejects.toBeDefined();
  });
});
