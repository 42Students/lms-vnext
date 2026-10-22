import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {retireCollegeBatch}
  from "@/modules/academics/college-batch-retire-service";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const own:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"batch-removal-test",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...own,membership:{...own.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const learner:RequestContext={...own,membership:{...own.membership!,roles:["LEARNER"]}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),section:randomUUID()};
const label="w-batch-remove-"+ids.cohort.slice(0,8);
let token="";
const body=()=>({expectedUpdatedAt:token,confirm:true});
describe.skipIf(!enabled)("Planned batch guarded removal PostgreSQL",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,label]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,label]);
    const result=await pool.query<{updated_at:Date}>(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4) RETURNING updated_at",
      [ids.cohort,ids.program,label,ids.period]);
    token=result.rows[0]!.updated_at.toISOString();
  });
  afterAll(async()=>{try{
    if(pool){
      await pool.query("DELETE FROM sections WHERE id=$1",[ids.section]);
      for(const [table,id] of [
        ["cohorts",ids.cohort],["programs",ids.program],["academic_periods",ids.period],
      ] as const)await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
      // Never delete immutable activity_events; cohorted subject ID is text only.
    }
  }finally{await pool?.end();await closeDatabaseConnection();}});
  it("blocks a child Section and correctly rejects SQL-default microsecond stale timestamp",async()=>{
    await pool!.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text)",
      [ids.section,ids.cohort,ids.period,label]);
    await expect(retireCollegeBatch(own,ids.cohort,body()))
      .rejects.toMatchObject({code:"BATCH_HAS_DEPENDENCIES"});
    await pool!.query("DELETE FROM sections WHERE id=$1",[ids.section]);
    await pool!.query("UPDATE cohorts SET updated_at=updated_at + interval '1 millisecond' WHERE id=$1",[ids.cohort]);
    await expect(retireCollegeBatch(own,ids.cohort,body()))
      .rejects.toMatchObject({code:"BATCH_STALE"});
    const updated=await pool!.query<{updated_at:Date}>("SELECT updated_at FROM cohorts WHERE id=$1",[ids.cohort]);
    token=updated.rows[0]!.updated_at.toISOString();
    const archived=await retireCollegeBatch(own,ids.cohort,body());
    expect(archived.status).toBe("ARCHIVED");
    const audit=await pool!.query("SELECT id FROM activity_events WHERE subject_type='cohort' AND subject_id=$1::text AND summary='Unused planned batch archived'",[ids.cohort]);
    expect(audit.rowCount).toBe(1);
  });
  it("conceals a foreign membership, denies a non-admin and forged scope",async()=>{
    await expect(retireCollegeBatch(foreign,ids.cohort,body())).rejects.toMatchObject({code:"BATCH_NOT_FOUND"});
    await expect(retireCollegeBatch(learner,ids.cohort,body())).rejects.toBeInstanceOf(AuthorizationError);
    await expect(retireCollegeBatch(own,ids.cohort,{...body(),collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
});
