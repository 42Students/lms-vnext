import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoOfferEvidence} from "@/modules/placements/tpo-offer-evidence-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const ctx:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"offer-evidence",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;rel?:string;job?:string;role?:string;app?:string;offer?:string;history?:string}={};
const grants:string[]=[];
describe.skipIf(!enabled)("TPO offer evidence scoped PG",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("isolated db required");
  for(const mid of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const row=await pool.query<{id:string}>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[mid]);
   if(row.rows[0]?.id)grants.push(row.rows[0].id);
  }
  ids.company=(await pool.query<{id:string}>("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",["Evidence "+randomUUID(),SEED_IDS.facultyUser])).rows[0]!.id;
  ids.rel=(await pool.query<{id:string}>("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",[SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.job=(await pool.query<{id:string}>("INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,'Evidence','Test','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$4) RETURNING id",[SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.rel,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.role=(await pool.query<{id:string}>("INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",[ids.job])).rows[0]!.id;
  ids.app=(await pool.query<{id:string}>("INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",[ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
  ids.offer=(await pool.query<{id:string}>("INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,issued_at,expires_at) VALUES($1,1,'ISSUED','Main',$2,'2026-10-01T00:00:00Z','2026-11-01T00:00:00Z') RETURNING id",[ids.app,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.history=(await pool.query<{id:string}>("INSERT INTO placement_offer_status_history(offer_id,from_status,to_status,actor_user_id) VALUES($1,NULL,'ISSUED',$2) RETURNING id",[ids.offer,SEED_IDS.facultyUser])).rows[0]!.id;
 });
 afterAll(async()=>{
  if(pool){
   if(ids.history)await pool.query("DELETE FROM placement_offer_status_history WHERE id=$1",[ids.history]);
   if(ids.offer)await pool.query("DELETE FROM placement_offers WHERE id=$1",[ids.offer]);
   if(ids.app)await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.app]);
   if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
   if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
   if(ids.rel)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.rel]);
   if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
   for(const id of grants)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
   await pool.end();
  }
  await closeDatabaseConnection();
 });
 it("reads own persisted status history, denies foreign and role mismatch",async()=>{
  const own=await getTpoOfferEvidence(ctx,{jobId:ids.job,offerId:ids.offer});
  expect(own.events.find(x=>x.to==="ISSUED")?.kind).toBe("Offer");
  const foreign:RequestContext={...ctx,membership:{...ctx.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(getTpoOfferEvidence(foreign,{jobId:ids.job,offerId:ids.offer})).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  const wrong:RequestContext={...ctx,membership:{...ctx.membership!,roles:["LEARNER"]}};
  await expect(getTpoOfferEvidence(wrong,{jobId:ids.job,offerId:ids.offer})).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoOfferEvidence(ctx,{jobId:ids.job,offerId:randomUUID()})).rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_FOUND"});
 });
});
