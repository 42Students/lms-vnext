import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoRoundReorderReadiness,reorderPlacementRounds} from "@/modules/placements/round-service";
import {getPlacementDriveDay} from "@/modules/placements/drive-day-service";
import {projectTpoRoundFacts} from "@/modules/placements/tpo-round-facts-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"round-reorder",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;rounds:string[]}={rounds:[]};
let roleId:string|undefined;
describe.skipIf(!enabled)("TPO-drive-workspace-37 persisted round reorder",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Disposable PG required");
  const role=await pool.query<{id:string}>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[SEED_IDS.facultyCollegeAMembership]);
  roleId=role.rows[0]?.id;
  const token=randomUUID();
  ids.company=(await pool.query<{id:string}>("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",["Reorder "+token,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.relationship=(await pool.query<{id:string}>("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",[SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
  ids.job=(await pool.query<{id:string}>("INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Reorder fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",[SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,"Reorder "+token,SEED_IDS.facultyUser])).rows[0]!.id;
  for(const [sequence,name] of [[1,"Test"],[2,"Interview"]] as const){
   const round=await pool.query<{id:string}>("INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id) VALUES($1,$2,'TEST',$3,$4) RETURNING id",[ids.job,sequence,name,SEED_IDS.facultyUser]);
   ids.rounds.push(round.rows[0]!.id);
  }
 });
 afterAll(async()=>{
  if(pool){
   for(const round of ids.rounds)await pool.query("DELETE FROM placement_job_round_events WHERE round_id=$1",[round]);
   if(ids.job)await pool.query("DELETE FROM placement_job_rounds WHERE job_id=$1",[ids.job]);
   if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
   if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
   if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
   if(roleId)await pool.query("DELETE FROM membership_roles WHERE id=$1",[roleId]);
   await pool.end();
  }
  await closeDatabaseConnection();
 });
 it("saves revised sequence and audits each moved round; then refuses locked work",async()=>{
  if(!pool||!ids.job)throw Error("PG fixture required");
  const ready=await getTpoRoundReorderReadiness(tpo,ids.job);
  expect(ready.allowed).toBe(true);
  const day=await getPlacementDriveDay(tpo,ids.job);
  expect(day.rounds).toHaveLength(2);
  const facts=projectTpoRoundFacts({
    ...day.rounds[0]!, scheduledAt:day.rounds[0]!.scheduledAt?.toISOString()??null,
    resultsDueAt:day.rounds[0]!.resultsDueAt?.toISOString()??null,
    participants:day.rounds[0]!.participants,
  });
  expect(facts).toMatchObject({status:"Not run yet",results:"None yet",when:"Date to be decided"});
  await reorderPlacementRounds(tpo,ids.job,{roundIds:[ids.rounds[1]!,ids.rounds[0]!]});
  const reordered=await getTpoRoundReorderReadiness(tpo,ids.job);
  expect(reordered.rounds.map(row=>row.id)).toEqual([ids.rounds[1],ids.rounds[0]]);
  const audit=await pool.query<{n:number}>("SELECT count(*)::int n FROM placement_job_round_events WHERE round_id = ANY($1::uuid[]) AND event_type='REORDERED'",[ids.rounds]);
  expect(audit.rows[0]?.n).toBe(2);
  await pool.query("UPDATE placement_job_rounds SET status='SCHEDULED',scheduled_at=now(),timezone='Asia/Kolkata',mode='VIRTUAL',meeting_url='https://example.com' WHERE id=$1",[ids.rounds[0]]);
  expect((await getTpoRoundReorderReadiness(tpo,ids.job)).allowed).toBe(false);
  await expect(reorderPlacementRounds(tpo,ids.job,{roundIds:ids.rounds})).rejects.toMatchObject({code:"PLACEMENT_ROUND_REORDER_INVALID"});
 });
});
