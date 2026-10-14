import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listAdminPlacementApplications} from "@/modules/admin-ui/super-admin-placement-applications-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-applications",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const ids:{company?:string;relationship?:string;job?:string;role?:string;application?:string}={};
const name="Admin Application "+randomUUID().slice(0,8);
describe.skipIf(!enabled)("Super Admin applications PostgreSQL",()=>{
 beforeAll(async()=>{
  ids.company=(await pool!.query<{id:string}>(
   "insert into placement_companies(name,created_by_user_id) values ($1,$2) returning id",
   [name,SEED_IDS.superAdminUser])).rows[0]!.id;
  ids.relationship=(await pool!.query<{id:string}>(
   "insert into placement_company_relationships(college_id,company_id,created_by_user_id) values ($1,$2,$3) returning id",
   [SEED_IDS.collegeA,ids.company,SEED_IDS.superAdminUser])).rows[0]!.id;
  ids.job=(await pool!.query<{id:string}>(
   "insert into placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) values ($1,$2,$3,$4,'Fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) returning id",
   [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,name,SEED_IDS.superAdminUser])).rows[0]!.id;
  ids.role=(await pool!.query<{id:string}>(
   "insert into placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) values ($1,'Engineer','FULL_TIME','ONSITE',true) returning id",[ids.job])).rows[0]!.id;
  ids.application=(await pool!.query<{id:string}>(
   "insert into placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) values ($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) returning id",
   [ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
 });
 afterAll(async()=>{try{
  if(ids.application)await pool?.query("delete from placement_applications where id=$1",[ids.application]);
  if(ids.role)await pool?.query("delete from placement_job_role_options where id=$1",[ids.role]);
  if(ids.job)await pool?.query("delete from placement_jobs where id=$1",[ids.job]);
  if(ids.relationship)await pool?.query("delete from placement_company_relationships where id=$1",[ids.relationship]);
  if(ids.company)await pool?.query("delete from placement_companies where id=$1",[ids.company]);
 }finally{await pool?.end();await closeDatabaseConnection();}});
 it("shows persisted application, hides foreign college and contact data, blocks wrong-role",async()=>{
  const own=await listAdminPlacementApplications(admin,{q:name,status:"SUBMITTED"});
  expect(own.items).toEqual([expect.objectContaining({id:ids.application,status:"SUBMITTED"})]);
  expect(JSON.stringify(own)).not.toContain("phoneE164");
  expect(JSON.stringify(own)).not.toContain("email");
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listAdminPlacementApplications(foreign,{q:name})).items).toHaveLength(0);
  await expect(listAdminPlacementApplications({...admin,user:{...admin.user,systemRoles:[]}},{})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
