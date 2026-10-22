import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getOwnLearnerSupportRequests} from "@/modules/placements/learner-support-request-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {enableSeedLearnerPlacementAccess} from "../support/w04-placement-access-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const ids={company:randomUUID(),relation:randomUUID(),job:randomUUID(),role:randomUUID(),application:randomUUID(),request:randomUUID()};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]}};
let prepared=false;
beforeAll(async()=>{
  await enableSeedLearnerPlacementAccess(pool);
  prepared=true;
  const suffix=ids.company.slice(0,8);
  await pool.query("INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",[ids.company,"Support "+suffix,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",[ids.relation,SEED_IDS.collegeA,ids.company,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,$5,$6,'FULL_TIME','REMOTE','PUBLISHED',now(),$7)",
    [ids.job,SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relation,"Support Drive "+suffix,"Scoped persisted request",SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode,is_primary) VALUES($1,$2,$3,'FULL_TIME','REMOTE',true)",
    [ids.role,ids.job,"Support role "+suffix]);
  await pool.query("INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [ids.application,ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser]);
  await pool.query("INSERT INTO placement_learner_requests(id,application_id,learner_membership_id,request_type,scope_key,reason,requested_by_user_id) VALUES($1,$2,(SELECT membership_id FROM placement_applications WHERE id=$2),'APPLICATION_WITHDRAWAL',$3,$4,$5)",
    [ids.request,ids.application,"APPLICATION_WITHDRAWAL:"+ids.application,"Please review my withdrawal request",SEED_IDS.learnerUser]);
},45000);
afterAll(async()=>{try{if(prepared){
  await pool.query("DELETE FROM placement_learner_requests WHERE id=$1",[ids.request]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.application]);
  await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
  await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
  await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relation]);
  await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}}finally{await pool.end();await closeDatabaseConnection();}},45000);
describe("read-only personal support requests, persisted PostgreSQL",()=>{
  it("lists only own existing placement request and status filtering",async()=>{
    const result=await getOwnLearnerSupportRequests(learner,{status:"PENDING"});
    expect(result.items).toEqual(expect.arrayContaining([expect.objectContaining({
      request:expect.objectContaining({id:ids.request,status:"PENDING"}),
    })]));
    const empty=await getOwnLearnerSupportRequests(learner,{status:"APPROVED"});
    expect(empty.items.some(row=>row.request.id===ids.request)).toBe(false);
  });
  it("denies forged-college, suspended, wrong-role and forged actor",async()=>{
    const denied:RequestContext[]=[
      {...learner,membership:{...learner.membership!,collegeId:SEED_IDS.collegeB}},
      {...learner,membership:{...learner.membership!,status:"SUSPENDED"}},
      {...learner,membership:{...learner.membership!,roles:["FACULTY"]}},
      {...learner,user:{...learner.user,id:SEED_IDS.facultyUser}},
    ];
    for(const context of denied) await expect(getOwnLearnerSupportRequests(context,{})).rejects.toBeDefined();
    await expect(getOwnLearnerSupportRequests(learner,{collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  });
});