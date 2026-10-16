import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB12_ISOLATED_TEST_DATABASE==="1"&&
  !!process.env.TEST_DATABASE_URL&&process.env.DATABASE_URL===process.env.TEST_DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const admin:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const fixture={
  program:randomUUID(),period:randomUUID(),cohort:randomUUID(),
  user:randomUUID(),member:randomUUID(),enrollment:randomUUID(),
};
async function cleanup(){
  if(!pool)return;
  await pool.query("DELETE FROM placement_batch_lifecycles WHERE cohort_id=$1",[fixture.cohort]);
  await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[fixture.enrollment]);
  await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[fixture.member]);
  await pool.query("DELETE FROM college_memberships WHERE id=$1",[fixture.member]);
  await pool.query("DELETE FROM users WHERE id=$1",[fixture.user]);
  await pool.query("DELETE FROM cohorts WHERE id=$1",[fixture.cohort]);
  await pool.query("DELETE FROM academic_periods WHERE id=$1",[fixture.period]);
  await pool.query("DELETE FROM programs WHERE id=$1",[fixture.program]);
}
describe.skipIf(!enabled)("TPO-students-R01 finished batch on isolated PostgreSQL",()=>{
  afterAll(async()=>{await cleanup();await pool?.end();await closeDatabaseConnection();});
  it("includes COMPLETED only for an explicitly selected finished cohort",async()=>{
    if(!pool)throw new Error("Isolated PostgreSQL required");
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES ($1,$2,'Past program',$3,8)",
      [fixture.program,SEED_IDS.departmentA,"past-"+fixture.program]);
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES ($1,$2,'Past year',$3,'2025-01-01','2025-12-31')",
      [fixture.period,SEED_IDS.collegeA,"period-"+fixture.period]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES ($1,$2,'Finished batch',$3,$4)",
      [fixture.cohort,fixture.program,"cohort-"+fixture.cohort,fixture.period]);
    await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES ($1,$2,'Finished learner')",
      [fixture.user,"test-"+fixture.user]);
    await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES ($1,$2,$3)",
      [fixture.member,fixture.user,SEED_IDS.collegeA]);
    await pool.query("INSERT INTO membership_roles(membership_id,role) VALUES ($1,'LEARNER')",[fixture.member]);
    await pool.query("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status,completed_at) VALUES ($1,$2,$3,$4,'COMPLETED',now())",
      [fixture.enrollment,fixture.member,fixture.program,fixture.cohort]);
    await pool.query("INSERT INTO placement_batch_lifecycles(cohort_id,college_id,registration_deadline,invited_at,finished_at,created_by_user_id,updated_by_user_id) VALUES ($1,$2,now()-interval '10 days',now()-interval '9 days',now()-interval '8 days',$3,$3)",
      [fixture.cohort,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser]);
    const current=await getTpoStudentsIntelligence(admin,{collegeId:SEED_IDS.collegeA});
    expect(current.roster.items.some(x=>x.membershipId===fixture.member)).toBe(false);
    const past=await getTpoStudentsIntelligence(admin,{
      collegeId:SEED_IDS.collegeA,batchId:fixture.cohort,
    });
    expect(past.roster.items).toEqual(expect.arrayContaining([
      expect.objectContaining({membershipId:fixture.member,
        cohortName:"Finished batch",fromFinishedBatch:true}),
    ]));
  });
});
