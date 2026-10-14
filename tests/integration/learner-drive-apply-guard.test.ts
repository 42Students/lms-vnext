import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {applyToPlacementJob} from "@/modules/placements/application-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {enableSeedLearnerPlacementAccess} from "../support/w04-placement-access-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const ids={company:randomUUID(),relation:randomUUID(),job:randomUUID(),role:randomUUID(),application:randomUUID()};
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]}};
let prepared=false;
beforeAll(async()=>{
  await enableSeedLearnerPlacementAccess(pool);
  prepared=true;
  const suffix=ids.company.slice(0,8);
  await pool.query("INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",[ids.company,"Drive apply "+suffix,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
    [ids.relation,SEED_IDS.collegeA,ids.company,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,$5,$6,'FULL_TIME','REMOTE','PUBLISHED',now(),$7)",
    [ids.job,SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relation,"Drive apply "+suffix,"Existing application fixture",SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode,is_primary) VALUES($1,$2,$3,'FULL_TIME','REMOTE',true)",
    [ids.role,ids.job,"Role "+suffix]);
  await pool.query("INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [ids.application,ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser]);
},45000);
afterAll(async()=>{try{if(prepared){
  // Pre-existing application idempotence does not add immutable history; leave append-only rows untouched.
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.application]);
  await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
  await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
  await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relation]);
  await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}}finally{await pool.end();await closeDatabaseConnection();}},45000);
describe("learner drive apply duplicate and authorization fences on PostgreSQL",()=>{
  it("returns the owned existing application without duplicate or new immutable audit",async()=>{
    const result=await applyToPlacementJob(learner,ids.job,{roleOptionId:ids.role});
    expect(result).toMatchObject({id:ids.application,membershipId:SEED_IDS.learnerCollegeAMembership,status:"SUBMITTED"});
    const count=await pool.query<{total:string}>("SELECT count(*)::text AS total FROM placement_applications WHERE job_id=$1 AND membership_id=$2",[ids.job,SEED_IDS.learnerCollegeAMembership]);
    expect(count.rows[0]?.total).toBe("1");
    const audit=await pool.query<{total:string}>("SELECT count(*)::text AS total FROM activity_events WHERE event_type='placements.application.submitted' AND subject_id=$1",[ids.application]);
    expect(audit.rows[0]?.total).toBe("0");
  });
  it("rejects forged college, suspended membership, wrong role, forged actor",async()=>{
    const denied:RequestContext[]=[
      {...learner,membership:{...learner.membership!,collegeId:SEED_IDS.collegeB}},
      {...learner,membership:{...learner.membership!,status:"SUSPENDED"}},
      {...learner,membership:{...learner.membership!,roles:["FACULTY"]}},
      {...learner,user:{...learner.user,id:SEED_IDS.facultyUser}},
    ];
    for(const actor of denied)await expect(applyToPlacementJob(actor,ids.job,{roleOptionId:ids.role})).rejects.toBeDefined();
    const rows=await pool.query("SELECT id FROM placement_applications WHERE job_id=$1",[ids.job]);
    expect(rows.rows.map(row=>row.id)).toEqual([ids.application]);
  });
});