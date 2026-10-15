import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoBatch, listTpoBatches, listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
import { decidePlacementParticipation, undoPlacementParticipation } from "@/modules/placements/batch-participation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url||
 process.env.DB08_ISOLATED_TEST_DATABASE!=="1"||process.env.DB08_MIGRATION_APPLIED!=="1")
 throw new Error("TPO batch PG tests require disposable DB08 isolated PostgreSQL and applied migration");
const pool=new Pool({connectionString:url,max:4});
const fixtures:{users:string[];memberships:string[];programs:string[];periods:string[];cohorts:string[]}={
 users:[],memberships:[],programs:[],periods:[],cohorts:[]
};
async function actor(collegeId:string,role:"TPO"|"LEARNER"):Promise<RequestContext>{
 const userId=randomUUID(),membershipId=randomUUID();
 fixtures.users.push(userId);fixtures.memberships.push(membershipId);
 await pool.query("INSERT INTO users (id,identity_uid,display_name) VALUES ($1::uuid,$2::text,'TPO Fixture')",[userId,"tpo-batch-"+userId]);
 await pool.query("INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1::uuid,$2::uuid,$3::uuid)",[membershipId,userId,collegeId]);
 await pool.query("INSERT INTO membership_roles (membership_id,role) VALUES ($1::uuid,$2::membership_role)",[membershipId,role]);
 return {user:{id:userId,identityUid:"tpo-batch-"+userId,platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:membershipId,collegeId,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:[role]}};
}
async function cohort(collegeId:string){
 const programId=randomUUID(),periodId=randomUUID(),cohortId=randomUUID();
 fixtures.programs.push(programId);fixtures.periods.push(periodId);fixtures.cohorts.push(cohortId);
 const departmentId=collegeId===SEED_IDS.collegeA?SEED_IDS.departmentA:SEED_IDS.departmentB;
 await pool.query("INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1::uuid,$2::uuid,$3::text,$4::text,8)",[programId,departmentId,"TPO Batch "+programId,"TPO"+programId]);
 await pool.query("INSERT INTO academic_periods (id,college_id,name,code,start_date,end_date) VALUES ($1::uuid,$2::uuid,$3::text,$4::text,'2026-07-01','2026-12-31')",[periodId,collegeId,"TPO Period "+periodId,"TPO"+periodId]);
 await pool.query("INSERT INTO cohorts (id,program_id,name,code,start_period_id) VALUES ($1::uuid,$2::uuid,$3::text,$4::text,$5::uuid)",[cohortId,programId,"TPO Cohort "+cohortId,"TPO"+cohortId,periodId]);
 return cohortId;
}
afterEach(async()=>{
 await pool.query("TRUNCATE TABLE placement_eligibility_events");
 if(fixtures.cohorts.length){
  await pool.query("DELETE FROM placement_eligibility_decisions WHERE scope_type='COHORT' AND scope_id=ANY($1::uuid[])",[fixtures.cohorts]);
  await pool.query("DELETE FROM placement_batch_lifecycles WHERE cohort_id=ANY($1::uuid[])",[fixtures.cohorts]);
  await pool.query("DELETE FROM cohorts WHERE id=ANY($1::uuid[])",[fixtures.cohorts]);
 }
 if(fixtures.periods.length)await pool.query("DELETE FROM academic_periods WHERE id=ANY($1::uuid[])",[fixtures.periods]);
 if(fixtures.programs.length)await pool.query("DELETE FROM programs WHERE id=ANY($1::uuid[])",[fixtures.programs]);
 if(fixtures.memberships.length){
  await pool.query("DELETE FROM membership_roles WHERE membership_id=ANY($1::uuid[])",[fixtures.memberships]);
  await pool.query("DELETE FROM college_memberships WHERE id=ANY($1::uuid[])",[fixtures.memberships]);
 }
 if(fixtures.users.length)await pool.query("DELETE FROM users WHERE id=ANY($1::uuid[])",[fixtures.users]);
 for(const list of Object.values(fixtures))list.length=0;
});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("TPO batch workspace DB08 scope and stale-version gates",()=>{
 it("reads own batch, commits a versioned cohort decision and rejects stale replay",async()=>{
  const ctx=await actor(SEED_IDS.collegeA,"TPO"),id=await cohort(SEED_IDS.collegeA);
  const listing=await listTpoBatches(ctx);
  expect(listing.batches.some(item=>item.id===id)).toBe(true);
  expect((await getTpoBatch(ctx,id)).decision.expectedVersion).toBe("none");
  const made=await decidePlacementParticipation(ctx,{collegeId:SEED_IDS.collegeA,changes:[{
   scopeType:"COHORT",scopeId:id,status:"ELIGIBLE",expectedVersion:"none"
  }]});
  expect(made.changedCount).toBe(1);
  await expect(decidePlacementParticipation(ctx,{collegeId:SEED_IDS.collegeA,changes:[{
   scopeType:"COHORT",scopeId:id,status:"INELIGIBLE",reason:"Not participating",expectedVersion:"none"
  }]})).rejects.toMatchObject({code:"DB08_ACTION_STALE"});
  expect((await listTpoBatchHistory(ctx,id)).events).toHaveLength(1);
  await undoPlacementParticipation(ctx,{collegeId:SEED_IDS.collegeA,actionId:made.actionId});
  expect((await getTpoBatch(ctx,id)).decision.status).toBe("NOT_DECIDED");
 });
 it("denies another college with no cohort details disclosed",async()=>{
  const owner=await actor(SEED_IDS.collegeA,"TPO");
  const visitor=await actor(SEED_IDS.collegeB,"TPO");
  const id=await cohort(SEED_IDS.collegeA);
  expect((await getTpoBatch(owner,id)).batch.id).toBe(id);
  await expect(getTpoBatch(visitor,id)).rejects.toBeDefined();
 });
 it("rejects forged TPO request-context roles for a persisted learner",async()=>{
  const member=await actor(SEED_IDS.collegeA,"LEARNER");
  const forged:RequestContext={...member,membership:{...member.membership!,roles:["TPO"]}};
  await expect(listTpoBatches(forged)).rejects.toBeDefined();
 });
});
