import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoDriveOfferRegister} from "@/modules/placements/tpo-drive-offer-register-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const ctx:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"offer-register",platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relation?:string;job?:string;role?:string;application?:string;offer?:string}={};
const granted:string[]=[];
describe.skipIf(!enabled)("offer register scoped PostgreSQL",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("isolated database required");
  for(const mid of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const a=await pool.query<{id:string}>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[mid]);
   if(a.rows[0]?.id)granted.push(a.rows[0].id);
  }
  ids.company=(await pool.query<{id:string}>("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",["Offer register "+randomUUID(),SEED_IDS.facultyUser])).rows[0]!.id;
  ids.relation=(await pool.query<{id:string}>("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",[SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.job=(await pool.query<{id:string}>("INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,'Offer register','Test','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$4) RETURNING id",[SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relation,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.role=(await pool.query<{id:string}>("INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",[ids.job])).rows[0]!.id;
  ids.application=(await pool.query<{id:string}>("INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",[ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
  ids.offer=(await pool.query<{id:string}>("INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,issued_at,expires_at) VALUES($1,1,'ISSUED','Main',$2,'2026-10-01T00:00:00Z','2026-11-01T00:00:00Z') RETURNING id",[ids.application,SEED_IDS.facultyUser])).rows[0]!.id;
 });
 afterAll(async()=>{
  if(pool){
   if(ids.offer)await pool.query("DELETE FROM placement_offers WHERE id=$1",[ids.offer]);
   if(ids.application)await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.application]);
   if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
   if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
   if(ids.relation)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relation]);
   if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
   for(const id of granted)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
   await pool.end();
  }await closeDatabaseConnection();
 });
 it("returns scoped offer and non-leaking foreign/wrong-role denial",async()=>{
  const own=await getTpoDriveOfferRegister(ctx,{jobId:ids.job,status:"ISSUED"});
  expect(own.rows.some(r=>r.id===ids.offer)).toBe(true);
  expect((await getTpoDriveOfferRegister(ctx,{jobId:ids.job,page:999})).page).toBe(1);
  const foreign:RequestContext={...ctx,membership:{...ctx.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(getTpoDriveOfferRegister(foreign,{jobId:ids.job})).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  const wrong:RequestContext={...ctx,membership:{...ctx.membership!,roles:["LEARNER"]}};
  await expect(getTpoDriveOfferRegister(wrong,{jobId:ids.job})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
