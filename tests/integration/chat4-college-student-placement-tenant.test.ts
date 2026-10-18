import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {placeImportedLearnerInSection} from "@/modules/people/college-student-import-placement";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const uid=()=>randomUUID();
const ids={period:uid(),program:uid(),cohort:uid(),section:uid(),
 ownUser:uid(),ownMembership:uid(),ownEnrollment:uid(),
 foreignUser:uid(),foreignMembership:uid(),foreignEnrollment:uid(),
 actingUser:uid(),actingMembership:uid()};
const tag="chat4-class-place-"+ids.section.slice(0,8);
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const staleActor:RequestContext={
 user:{id:ids.actingUser,identityUid:tag+"-acting",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:ids.actingMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

describe.skipIf(!enabled)("College Admin class placement tenant and actor guard (PostgreSQL)",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Disposable PostgreSQL fixture required");
  for(const [u,m,c,role] of [
   [ids.ownUser,ids.ownMembership,SEED_IDS.collegeA,"LEARNER"],
   [ids.foreignUser,ids.foreignMembership,SEED_IDS.collegeB,"LEARNER"],
   [ids.actingUser,ids.actingMembership,SEED_IDS.collegeA,"COLLEGE_ADMIN"],
  ]) {
   await pool.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",
    [u,tag+"-"+u,tag]);
   await pool.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",[m,u,c]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,$2)",[m,role]);
  }
  await pool.query("insert into academic_periods(id,college_id,name,code,start_date,end_date,status) values($1,$2,$3,$3,'2026-07-01','2027-06-30','ACTIVE')",
   [ids.period,SEED_IDS.collegeA,tag]);
  await pool.query("insert into programs(id,department_id,name,code,duration_terms,status) values($1,$2,$3,$3,8,'ACTIVE')",
   [ids.program,SEED_IDS.departmentA,tag]);
  await pool.query("insert into cohorts(id,program_id,name,code,start_period_id,status) values($1,$2,$3,$3,$4,'ACTIVE')",
   [ids.cohort,ids.program,tag,ids.period]);
  await pool.query("insert into sections(id,cohort_id,academic_period_id,name,code,status) values($1,$2,$3,$4,$4,'ACTIVE')",
   [ids.section,ids.cohort,ids.period,tag]);
  for(const [enrollment,member] of [
   [ids.ownEnrollment,ids.ownMembership],[ids.foreignEnrollment,ids.foreignMembership],
  ])await pool.query("insert into learner_program_enrollments(id,membership_id,program_id,cohort_id,status) values($1,$2,$3,$4,'ACTIVE')",
   [enrollment,member,ids.program,ids.cohort]);
 });
 afterAll(async()=>{
  try {
   if(pool){
    await pool.query("delete from section_enrollments where section_id=$1",[ids.section]);
    await pool.query("delete from learner_program_enrollments where cohort_id=$1",[ids.cohort]);
    await pool.query("delete from sections where id=$1",[ids.section]);
    await pool.query("delete from cohorts where id=$1",[ids.cohort]);
    await pool.query("delete from programs where id=$1",[ids.program]);
    await pool.query("delete from academic_periods where id=$1",[ids.period]);
    // Activity rows preserve author/membership FK identity on this disposable DB.
   }
  }finally{await pool?.end();await closeDatabaseConnection();}
 });
 it("COL-student-import-PG-03 cannot place another college's enrollment even with a matching cohort UUID",async()=>{
  await expect(placeImportedLearnerInSection(admin,ids.foreignEnrollment,ids.section))
   .rejects.toThrow("CLASS_BATCH_MISMATCH");
  const untouched=await pool!.query("select id from section_enrollments where learner_enrollment_id=$1",
   [ids.foreignEnrollment]);
  expect(untouched.rows).toHaveLength(0);
  const placed=await placeImportedLearnerInSection(admin,ids.ownEnrollment,ids.section);
  expect(placed.id).toBeTruthy();
  await expect(placeImportedLearnerInSection(admin,ids.ownEnrollment,ids.section))
   .rejects.toThrow("ALREADY_PLACED_IN_PERIOD");
 });
 it("COL-student-import-PG-04 persisted role revocation prevents writes despite a stale active request context",async()=>{
  await pool!.query("delete from membership_roles where membership_id=$1 and role='COLLEGE_ADMIN'",
   [ids.actingMembership]);
  await expect(placeImportedLearnerInSection(staleActor,ids.foreignEnrollment,ids.section))
   .rejects.toMatchObject({name:"AuthorizationError"});
  const unchanged=await pool!.query("select id from section_enrollments where learner_enrollment_id=$1",
   [ids.foreignEnrollment]);
  expect(unchanged.rows).toHaveLength(0);
 });
});
