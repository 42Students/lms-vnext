import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {reviewTpoApplicant} from "@/modules/placements/tpo-applicant-review-service";
import {getTpoApplicantPipeline} from "@/modules/placements/tpo-applicant-pipeline-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-applicant-review",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;role?:string;app?:string}={};const addedRoles:string[]=[];
async function fixture(){
 if(!pool)throw Error("Test PG required");
 const name="Review "+randomUUID();
 ids.company=(await pool.query<{id:string}>(
  "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
  [name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.relationship=(await pool.query<{id:string}>(
  "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
  [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Review fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",
  [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.role=(await pool.query<{id:string}>(
  "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",
  [ids.job])).rows[0]!.id;
 ids.app=(await pool.query<{id:string}>(
  "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
  [ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
 await pool.query("INSERT INTO placement_application_screenings(application_id) VALUES($1)",[ids.app]);
 await pool.query("UPDATE placement_application_screenings SET updated_at=date_trunc('milliseconds',updated_at)+interval '123 microseconds' WHERE application_id=$1",[ids.app]);
 const row=await pool.query<{updated_at:Date}>("SELECT updated_at FROM placement_application_screenings WHERE application_id=$1",[ids.app]);
 return {jobId:ids.job,applicationId:ids.app,expectedUpdatedAt:row.rows[0]!.updated_at.toISOString()};
}
async function cleanup(){
 if(!pool)return;
 if(ids.app){
  await pool.query("DELETE FROM placement_application_screening_history WHERE application_id=$1",[ids.app]);
  await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[ids.app]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.app]);
 }
 if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}
describe.skipIf(!enabled)("TPO review scoped PG",()=>{
 beforeAll(async()=>{if(!pool)throw Error("Test DB missing");for(const id of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
  const row=await pool.query<{id:string}>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[id]);
  if(row.rows[0]?.id)addedRoles.push(row.rows[0].id);
 }});
 afterAll(async()=>{await cleanup();if(pool){for(const id of addedRoles)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);await pool.end();}await closeDatabaseConnection();});
 it("shortlists with history/audit; rejects foreign, wrong role, stale microsecond token",async()=>{
  if(!pool)throw Error("PG required");
  const fixtureState=await fixture(),params={jobId:fixtureState.jobId,applicationId:fixtureState.applicationId};
  const body={confirmed:true,expectedUpdatedAt:fixtureState.expectedUpdatedAt,
   decision:"SHORTLISTED",note:"Meets required hiring conditions"};
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(reviewTpoApplicant(foreign,params,body)).rejects.toMatchObject({code:"PLACEMENT_APPLICATION_NOT_FOUND"});
  const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(reviewTpoApplicant(wrong,params,body)).rejects.toBeInstanceOf(AuthorizationError);
  const snapshot=await getTpoApplicantPipeline(tpo,{jobId:params.jobId});
  expect(snapshot.rows.find(row=>row.id===params.applicationId)).toMatchObject({
   screeningUpdatedAt:body.expectedUpdatedAt,eligibilityStatus:"ELIGIBLE",channel:"INTERNAL",
  });
  await expect(getTpoApplicantPipeline(foreign,{jobId:params.jobId}))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getTpoApplicantPipeline(wrong,{jobId:params.jobId})).rejects.toBeInstanceOf(AuthorizationError);
  const offsetToken=new Date(new Date(body.expectedUpdatedAt).getTime()+19800000)
   .toISOString().replace("Z","+05:30");
  const saved=await reviewTpoApplicant(tpo,params,{...body,expectedUpdatedAt:offsetToken});
  expect(saved.status).toBe("SHORTLISTED");
  await expect(reviewTpoApplicant(tpo,params,body)).rejects.toMatchObject({code:"PLACEMENT_SCREENING_STALE"});
  const history=await pool.query<{n:number}>("SELECT count(*)::int n FROM placement_application_screening_history WHERE application_id=$1",[ids.app]);
  const audit=await pool.query<{n:number}>("SELECT count(*)::int n FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_SCREENING_DECIDED'",[ids.app]);
  expect(history.rows[0]?.n).toBe(1);
  expect(audit.rows[0]?.n).toBe(1);
 });
});
