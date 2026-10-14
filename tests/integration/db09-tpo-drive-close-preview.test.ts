import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {closeTpoDriveWithPreview,getTpoDriveClosePreview} from "@/modules/placements/tpo-drive-close-preview-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-close-preview",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;role?:string;application?:string;round?:string;offer?:string}={};const roleIds:string[]=[];
async function fixture(){
 if(!pool)throw Error("Disposable database required");
 const name="Close "+randomUUID();
 ids.company=(await pool.query<{id:string}>(
  "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
  [name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.relationship=(await pool.query<{id:string}>(
  "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
  [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Close fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",
  [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.role=(await pool.query<{id:string}>(
  "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",
  [ids.job])).rows[0]!.id;
 ids.application=(await pool.query<{id:string}>(
  "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
  [ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
 ids.round=(await pool.query<{id:string}>(
  "INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id,status) VALUES($1,1,'INTERVIEW','Panel',$2,'PENDING') RETURNING id",
  [ids.job,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.offer=(await pool.query<{id:string}>(
  "INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,issued_at,expires_at) VALUES($1,1,'ISSUED','Main',$2,now()-interval '1 day',now()+interval '2 days') RETURNING id",
  [ids.application,SEED_IDS.facultyUser])).rows[0]!.id;
 await pool.query("UPDATE placement_jobs SET updated_at=date_trunc('milliseconds',updated_at)+interval '321 microseconds' WHERE id=$1",[ids.job]);
 return ids.job;
}
async function cleanup(){
 if(!pool)return;
 if(ids.offer)await pool.query("DELETE FROM placement_offers WHERE id=$1",[ids.offer]);
 if(ids.round)await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[ids.round]);
 if(ids.application)await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.application]);
 if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}
describe.skipIf(!enabled)("TPO close consequence preview isolated PostgreSQL",()=>{
 beforeAll(async()=>{if(!pool)throw Error("PG required");
  for(const id of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const r=await pool.query<{id:string}>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[id]);
   if(r.rows[0]?.id)roleIds.push(r.rows[0].id);
  }
 });
 afterAll(async()=>{await cleanup();if(pool){
  for(const id of roleIds)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
  await pool.end();
 }await closeDatabaseConnection();});
 it("closes from an accurate SQL-microsecond preview and audits; rejects forged scope and stale data",async()=>{
  if(!pool)throw Error("PG required");
  const jobId=await fixture(),snapshot=await getTpoDriveClosePreview(tpo,jobId);
  expect(snapshot.counts).toEqual({applications:1,rounds:1,offers:1});
  const write={action:"CLOSE",confirmed:true,expectedUpdatedAt:snapshot.expectedUpdatedAt,
   expectedCounts:snapshot.counts,reason:"Drive completed with all records retained"};
  await expect(closeTpoDriveWithPreview(tpo,jobId,{
   ...write,expectedCounts:{...write.expectedCounts,offers:0},
  })).rejects.toMatchObject({code:"PLACEMENT_JOB_PREVIEW_STALE"});
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,
   id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(closeTpoDriveWithPreview(foreign,jobId,write))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(closeTpoDriveWithPreview(wrong,jobId,write)).rejects.toBeInstanceOf(AuthorizationError);
  const offsetToken=new Date(new Date(write.expectedUpdatedAt).getTime()+19800000)
   .toISOString().replace("Z","+05:30");
  const saved=await closeTpoDriveWithPreview(tpo,jobId,{...write,expectedUpdatedAt:offsetToken});
  expect(saved.status).toBe("CLOSED");
  await expect(closeTpoDriveWithPreview(tpo,jobId,write))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_STALE"});
  const audit=await pool.query<{count:number}>(
   "SELECT count(*)::int AS count FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_TPO_DRIVE_CLOSED_WITH_PREVIEW'",[jobId]);
  expect(audit.rows[0]?.count).toBe(1);
 });
});
