import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {updateCollegeOfferingMetadata}
  from "@/modules/courses/college-offering-metadata-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const own:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"offering-metadata",
  platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.collegeAdminMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const foreign:RequestContext={...own,membership:{...own.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const faculty:RequestContext={...own,membership:{...own.membership!,roles:["FACULTY"]}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),
  section:randomUUID(),course:randomUUID(),offering:randomUUID(),delivery:randomUUID()};
const name="w-off-meta-"+ids.offering.slice(0,8);
let token="";
const body=()=>({expectedUpdatedAt:token,type:"ELECTIVE",credits:4,displayOrder:2,confirm:true});
describe.skipIf(!enabled)("College offering metadata PostgreSQL scope and stale edits",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable test PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period,SEED_IDS.collegeA,name]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,name]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,name,ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text)",
      [ids.section,ids.cohort,ids.period,name]);
    await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3::text,$3::text)",
      [ids.course,SEED_IDS.departmentA,name]);
    const saved=await pool.query<{updated_at:Date}>("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4) RETURNING updated_at",
      [ids.offering,ids.course,ids.cohort,ids.period]);
    token=saved.rows[0]!.updated_at.toISOString();
  });
  afterAll(async()=>{try{if(pool){
    await pool.query("DELETE FROM course_section_deliveries WHERE id=$1",[ids.delivery]);
    for(const [table,id] of [["course_offerings",ids.offering],["courses",ids.course],
      ["sections",ids.section],["cohorts",ids.cohort],["programs",ids.program],
      ["academic_periods",ids.period]] as const)
      {if(table==="courses") await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[id]);
       if(table==="programs") await pool.query("DELETE FROM program_terms WHERE program_id=$1",[id]);
       await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);}
    // Never delete activity_events: append-only and subject ID is text.
  }}finally{await pool?.end();await closeDatabaseConnection();}});
  it("nonleaking cross-college denial, wrong role, timestamp stale denial and audited update",async()=>{
    await expect(updateCollegeOfferingMetadata(foreign,ids.offering,body()))
      .rejects.toMatchObject({code:"OFFERING_NOT_FOUND"});
    await expect(updateCollegeOfferingMetadata(faculty,ids.offering,body()))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateCollegeOfferingMetadata(own,ids.offering,{...body(),collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    const saved=await updateCollegeOfferingMetadata(own,ids.offering,body());
    expect(saved).toMatchObject({type:"ELECTIVE",credits:4,displayOrder:2});
    await expect(updateCollegeOfferingMetadata(own,ids.offering,body()))
      .rejects.toMatchObject({code:"OFFERING_STALE"});
    const audit=await pool!.query("SELECT summary FROM activity_events WHERE subject_type='course_offering' AND subject_id=$1::text",[ids.offering]);
    expect(audit.rows.map(r=>r.summary)).toContain("College Admin updated course offering metadata");
  });
  it("rejects type changes when a live delivery depends on the offering",async()=>{
    await pool!.query("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
      [ids.delivery,ids.offering,ids.section]);
    const current=await pool!.query<{updated_at:Date}>("SELECT updated_at FROM course_offerings WHERE id=$1",[ids.offering]);
    token=current.rows[0]!.updated_at.toISOString();
    await expect(updateCollegeOfferingMetadata(own,ids.offering,{...body(),type:"CORE"}))
      .rejects.toMatchObject({code:"OFFERING_HAS_ACTIVE_DELIVERIES"});
    const orderOnly=await updateCollegeOfferingMetadata(own,ids.offering,{...body(),displayOrder:3});
    expect(orderOnly.displayOrder).toBe(3);
  });
});
