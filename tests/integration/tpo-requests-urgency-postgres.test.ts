import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoGlobalRequestsInbox} from "@/modules/placements/tpo-global-requests-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-request-urgency",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;role?:string;application?:string;round?:string;requests:string[]}={requests:[]};
let memberRoleId:string|undefined;
describe.skipIf(!enabled)("TPO-requests-verification-08 real urgency and next-round query",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Disposable PG required");
  const r=await pool.query<{id:string}>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[SEED_IDS.facultyCollegeAMembership]);
  memberRoleId=r.rows[0]?.id;
  const token=randomUUID();
  ids.company=(await pool.query<{id:string}>("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",["Urgency "+token,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.relationship=(await pool.query<{id:string}>("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",[SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.job=(await pool.query<{id:string}>("INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Urgency fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",[SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,"Urgency "+token,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.role=(await pool.query<{id:string}>("INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Analyst','FULL_TIME','ONSITE',true) RETURNING id",[ids.job])).rows[0]!.id;
  ids.application=(await pool.query<{id:string}>("INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",[ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
  await pool.query("INSERT INTO placement_application_screenings(application_id) VALUES($1)",[ids.application]);
  ids.round=(await pool.query<{id:string}>("INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id,status,scheduled_at,timezone,mode,meeting_url,duration_minutes) VALUES($1,1,'INTERVIEW','Interview',$2,'SCHEDULED',now()+interval '6 hours','Asia/Kolkata','VIRTUAL','https://example.test/meeting',30) RETURNING id",[ids.job,SEED_IDS.facultyUser])).rows[0]!.id;
  for(const type of ["APPLICATION_WITHDRAWAL","ROUND_RESCHEDULE"] as const){
   const request=await pool.query<{id:string}>("INSERT INTO placement_learner_requests(application_id,request_type,round_id,scope_key,reason,requested_by_user_id,requested_at) VALUES($1,$2,$3,$4,'Please review this request',$5,now()-interval '28 hours') RETURNING id",[
    ids.application,type,type==="ROUND_RESCHEDULE"?ids.round:null,"urgent:"+token+":"+type,SEED_IDS.learnerUser]);
   ids.requests.push(request.rows[0]!.id);
  }
 });
 afterAll(async()=>{
  if(pool){
   if(ids.requests.length)await pool.query("DELETE FROM placement_learner_requests WHERE id=ANY($1::uuid[])",[ids.requests]);
   if(ids.round)await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[ids.round]);
   if(ids.application)await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[ids.application]);
   if(ids.application)await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.application]);
   if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
   if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
   if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
   if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
   if(memberRoleId)await pool.query("DELETE FROM membership_roles WHERE id=$1",[memberRoleId]);
   await pool.end();
  }
  await closeDatabaseConnection();
 });
 it("shows the authorized persisted urgent requests, tomorrow round and severity ordering",async()=>{
  const data=await getTpoGlobalRequestsInbox(tpo,{status:"PENDING",sort:"URGENCY_FIRST",pageSize:100});
  const seeded=data.requests.filter(row=>ids.requests.includes(row.id));
  expect(seeded).toHaveLength(2);
  expect(seeded.every(row=>row.urgent)).toBe(true);
  expect(seeded.every(row=>row.nextRoundName==="Interview")).toBe(true);
  expect(seeded.every(row=>row.nextRoundAt instanceof Date)).toBe(true);
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,
   id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  const elsewhere=await getTpoGlobalRequestsInbox(foreign,{status:"PENDING",sort:"URGENCY_FIRST"});
  expect(elsewhere.requests.some(row=>ids.requests.includes(row.id))).toBe(false);
 });
});
