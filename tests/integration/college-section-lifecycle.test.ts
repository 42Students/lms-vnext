import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {changeCollegeSectionLifecycle}
  from "@/modules/academics/college-section-lifecycle-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"class-life-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...admin,membership:{...admin.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const learner:RequestContext={...admin,membership:{...admin.membership!,roles:["LEARNER"]}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),section:randomUUID(),event:randomUUID()};
const name="w-class-life-"+ids.section.slice(0,8);
let token="";
const command=(action:"ARCHIVE"|"RESTORE")=>({action,expectedUpdatedAt:token,confirm:true});
describe.skipIf(!enabled)("College class lifecycle disposable PostgreSQL",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,name]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,name]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,name,ids.period]);
    const rows=await pool.query<{updated_at:Date}>(
      "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text) RETURNING updated_at",
      [ids.section,ids.cohort,ids.period,name]);
    token=rows.rows[0]!.updated_at.toISOString();
  });
  afterAll(async()=>{try{if(pool){
    await pool.query("DELETE FROM section_schedule_events WHERE id=$1",[ids.event]);
    for(const [table,id] of [["sections",ids.section],["cohorts",ids.cohort],
      ["programs",ids.program],["academic_periods",ids.period]] as const)
      await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
    // Immutable activity_events are never removed.
  }}finally{await pool?.end();await closeDatabaseConnection();}});
  it("non-leaking foreign and wrong-role denials, stale token, archived and restored audit",async()=>{
    await expect(changeCollegeSectionLifecycle(foreign,ids.section,command("ARCHIVE")))
      .rejects.toMatchObject({code:"CLASS_NOT_FOUND"});
    await expect(changeCollegeSectionLifecycle(learner,ids.section,command("ARCHIVE")))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(changeCollegeSectionLifecycle(admin,ids.section,{...command("ARCHIVE"),collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    const result=await changeCollegeSectionLifecycle(admin,ids.section,command("ARCHIVE"));
    expect(result.status).toBe("ARCHIVED");
    await expect(changeCollegeSectionLifecycle(admin,ids.section,command("RESTORE")))
      .rejects.toMatchObject({code:"CLASS_STALE"});
    token=result.updatedAt.toISOString();
    const restored=await changeCollegeSectionLifecycle(admin,ids.section,command("RESTORE"));
    expect(restored.status).toBe("ACTIVE");
    const audit=await pool!.query("SELECT summary FROM activity_events WHERE subject_type='section' AND subject_id=$1::text",[ids.section]);
    expect(audit.rows.map(row=>row.summary)).toContain("College Admin archived class");
    expect(audit.rows.map(row=>row.summary)).toContain("College Admin restored class");
  });
  it("refuses archive if any scheduled session history exists",async()=>{
    const r=await pool!.query<{updated_at:Date}>("SELECT updated_at FROM sections WHERE id=$1",[ids.section]);
    token=r.rows[0]!.updated_at.toISOString();
    await pool!.query("INSERT INTO section_schedule_events(id,section_id,title,starts_at,ends_at) VALUES($1,$2,$3::text,'2026-10-15T03:30:00Z','2026-10-15T04:30:00Z')",
      [ids.event,ids.section,name]);
    await expect(changeCollegeSectionLifecycle(admin,ids.section,command("ARCHIVE")))
      .rejects.toMatchObject({code:"CLASS_HAS_DEPENDENCIES"});
  });
});
