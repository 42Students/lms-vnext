import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoApplicantDetail} from "@/modules/placements/tpo-applicant-detail-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-applicant-detail",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;role?:string;app?:string;offer?:string}={};
const roles:string[]=[];
async function fixture(){
 if(!pool)throw Error("Disposable PostgreSQL required");
 const title="Applicant "+randomUUID();
 ids.company=(await pool.query<{id:string}>(
  "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
  [title,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.relationship=(await pool.query<{id:string}>(
  "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
  [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Test','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",
  [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,title,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.role=(await pool.query<{id:string}>(
  "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",
  [ids.job])).rows[0]!.id;
 ids.app=(await pool.query<{id:string}>(
  "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
  [ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
 await pool.query("INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) VALUES($1,'SHORTLISTED',$2,now())",
  [ids.app,SEED_IDS.facultyUser]);
 ids.offer=(await pool.query<{id:string}>(
  "INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,issued_at,expires_at) VALUES($1,1,'ISSUED','Main',$2,now()-interval '1 day',now()+interval '3 days') RETURNING id",
  [ids.app,SEED_IDS.facultyUser])).rows[0]!.id;
 return {jobId:ids.job,applicationId:ids.app};
}
async function cleanup(){
 if(!pool)return;
 if(ids.offer)await pool.query("DELETE FROM placement_offers WHERE id=$1",[ids.offer]);
 if(ids.app){
  await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[ids.app]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.app]);
 }
 if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}
describe.skipIf(!enabled)("TPO applicant detail isolated PostgreSQL",()=>{
 beforeAll(async()=>{if(!pool)throw Error("PG required");
  for(const memberId of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const row=await pool.query<{id:string}>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[memberId]);
   if(row.rows[0]?.id)roles.push(row.rows[0].id);
  }
 });
 afterAll(async()=>{await cleanup();if(pool){
  for(const id of roles)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
  await pool.end();
 }await closeDatabaseConnection();});
 it("reads scoped applicant, screening and offer; denies foreign/wrong-role/nonexistent record",async()=>{
  const params=await fixture();
  const detail=await getTpoApplicantDetail(tpo,params);
  expect(detail.application.id).toBe(params.applicationId);
  expect(detail.screening).toBe("SHORTLISTED");
  expect(detail.offers).toHaveLength(1);
  expect(detail.offers[0]?.joiningStatus).toBeNull();
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,
   id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(getTpoApplicantDetail(foreign,params)).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(getTpoApplicantDetail(wrong,params)).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoApplicantDetail(tpo,{jobId:params.jobId,applicationId:randomUUID()}))
   .rejects.toMatchObject({code:"PLACEMENT_APPLICATION_NOT_FOUND"});
 });
});
