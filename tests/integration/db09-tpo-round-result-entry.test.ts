import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoRoundResultTable} from "@/modules/placements/tpo-round-result-table-service";
import {confirmTpoRoundResult} from "@/modules/placements/tpo-confirmed-round-result-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-entry-table",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;role?:string;app?:string;round?:string}={};
const roleIds:string[]=[];
async function fixture(){
 if(!pool)throw Error("Isolated PG required");const token=randomUUID();
 ids.company=(await pool.query<{id:string}>(
  "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
  ["Entry "+token,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.relationship=(await pool.query<{id:string}>(
  "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
  [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Entry fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",
  [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,"Entry "+token,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.role=(await pool.query<{id:string}>(
  "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",
  [ids.job])).rows[0]!.id;
 ids.app=(await pool.query<{id:string}>(
  "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
  [ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
 await pool.query(
  "INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) VALUES($1,'SHORTLISTED',$2,now())",
  [ids.app,SEED_IDS.facultyUser]);
 ids.round=(await pool.query<{id:string}>(
  "INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id,status,scheduled_at,timezone,mode,meeting_url,duration_minutes) VALUES($1,1,'INTERVIEW','Technical',$2,'SCHEDULED',now()+interval '1 day','Asia/Kolkata','VIRTUAL','https://example.org/meeting',60) RETURNING id",
  [ids.job,SEED_IDS.facultyUser])).rows[0]!.id;
 return {jobId:ids.job,roundId:ids.round};
}
async function cleanup(){
 if(!pool)return;
 if(ids.round)await pool.query("DELETE FROM placement_round_results WHERE round_id=$1",[ids.round]);
 if(ids.round)await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[ids.round]);
 if(ids.app){
  await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[ids.app]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.app]);
 }
 if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}
describe.skipIf(!enabled)("TPO results entry PostgreSQL",()=>{
 beforeAll(async()=>{if(!pool)throw Error("DB required");
  for(const id of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const row=await pool.query<{id:string}>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[id]);
   if(row.rows[0]?.id)roleIds.push(row.rows[0].id);
  }
 });
 afterAll(async()=>{await cleanup();if(pool){
  for(const id of roleIds)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
  await pool.end();
 }await closeDatabaseConnection();});
 it("stages confirmed version with audit; fences foreign/wrong role and stale identity",async()=>{
  if(!pool)throw Error("DB required");
  const q=await fixture();
  const initial=await getTpoRoundResultTable(tpo,q);
  expect(initial.rows.find(x=>x.applicationId===ids.app)?.resultId).toBeNull();
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(getTpoRoundResultTable(foreign,q)).rejects.toMatchObject({code:"PLACEMENT_ROUND_NOT_FOUND"});
  const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(getTpoRoundResultTable(wrong,q)).rejects.toBeInstanceOf(AuthorizationError);
  const body={confirmed:true,expectedCurrentResultId:null,
   result:{applicationId:ids.app,outcome:"PASS",internalComment:"Candidate passed interview"}};
  await expect(confirmTpoRoundResult(foreign,q.roundId,body))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_NOT_FOUND"});
  await expect(confirmTpoRoundResult(wrong,q.roundId,body)).rejects.toBeInstanceOf(AuthorizationError);
  const saved=await confirmTpoRoundResult(tpo,q.roundId,body);
  expect(saved.status).toBe("STAGED");
  await expect(confirmTpoRoundResult(tpo,q.roundId,body))
   .rejects.toMatchObject({code:"PLACEMENT_RESULT_NOT_FOUND"});
  const audit=await pool.query<{n:number}>(
   "SELECT count(*)::int n FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_RESULT_STAGED'",[saved.id]);
  expect(audit.rows[0]?.n).toBeGreaterThanOrEqual(1);
  await pool.query("UPDATE placement_jobs SET status='CLOSED',closed_at=now() WHERE id=$1",[q.jobId]);
  const closed=await getTpoRoundResultTable(tpo,q);
  expect(closed.rows.every(row=>!row.editable)).toBe(true);
  await expect(confirmTpoRoundResult(tpo,q.roundId,{...body,expectedCurrentResultId:saved.id}))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_READ_ONLY"});
 });
});
