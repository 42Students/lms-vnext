import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {rescheduleTpoInterview} from "@/modules/placements/tpo-interview-reschedule-service";
import {actOnPlacementRound} from "@/modules/placements/round-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-interview-reschedule",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;otherJob?:string;first?:string;second?:string}={};const roles:string[]=[];
async function fixture(){
 if(!pool)throw Error("Disposable PG required");const title="Interview "+randomUUID();
 ids.company=(await pool.query<{id:string}>(
  "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
  [title,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.relationship=(await pool.query<{id:string}>(
  "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
  [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Interview fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",
  [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,title,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.otherJob=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) SELECT college_id,season_id,company_relationship_id,title||' competitor',description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id FROM placement_jobs WHERE id=$1 RETURNING id",
  [ids.job])).rows[0]!.id;
 for(const [index,delay] of [[1,3],[2,4]] as const){
  const row=await pool.query<{id:string}>(
   "INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id,status,scheduled_at,timezone,mode,venue,duration_minutes) VALUES($1,$2,'INTERVIEW',$3,$4,'SCHEDULED',now()+($5::int * interval '1 day'),'Asia/Kolkata','ON_CAMPUS','Room A',60) RETURNING id",
   [index===1?ids.job:ids.otherJob,index,"Round "+index,SEED_IDS.facultyUser,delay]);
  if(index===1)ids.first=row.rows[0]!.id;else ids.second=row.rows[0]!.id;
 }
 await pool.query("UPDATE placement_job_rounds SET updated_at=date_trunc('milliseconds',updated_at)+interval '413 microseconds' WHERE id=$1",[ids.first]);
 return ids.first!;
}
function localIst(date:Date){
 return date.toLocaleString("sv-SE",{timeZone:"Asia/Kolkata"}).replace(" ","T").slice(0,16);
}
async function cleanup(){
 if(!pool)return;
 for(const id of [ids.first,ids.second])if(id){
  await pool.query("DELETE FROM placement_job_round_events WHERE round_id=$1",[id]);
  await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[id]);
 }
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.otherJob)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.otherJob]);
 if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}
describe.skipIf(!enabled)("TPO interview reschedule PG",()=>{
 beforeAll(async()=>{if(!pool)throw Error("PG required");
  for(const id of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const row=await pool.query<{id:string}>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[id]);
   if(row.rows[0]?.id)roles.push(row.rows[0].id);
  }
 });
 afterAll(async()=>{await cleanup();if(pool){for(const id of roles)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
  await pool.end();}await closeDatabaseConnection();});
 it("rejects occupied venue, stale/foreign/wrong-role and commits audited valid reschedule",async()=>{
  if(!pool)throw Error("PG required");
  const id=await fixture();
  const current=(await pool.query<{updated_at:Date}>(
   "SELECT updated_at FROM placement_job_rounds WHERE id=$1",[id])).rows[0]!;
  const competitor=(await pool.query<{scheduled_at:Date}>(
   "SELECT scheduled_at FROM placement_job_rounds WHERE id=$1",[ids.second])).rows[0]!;
  const base={confirmed:true,expectedUpdatedAt:current.updated_at.toISOString(),
   localDateTime:localIst(competitor.scheduled_at),mode:"ON_CAMPUS",venue:"Room A",
   reason:"Employer requested another interview time"};
  await expect(rescheduleTpoInterview(tpo,id,base))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_VENUE_CONFLICT"});
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,
   id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(rescheduleTpoInterview(foreign,id,base))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_NOT_FOUND"});
  const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(rescheduleTpoInterview(wrong,id,base)).rejects.toBeInstanceOf(AuthorizationError);
  const target=new Date(competitor.scheduled_at.getTime()+86400000);
  const offsetToken=new Date(new Date(base.expectedUpdatedAt).getTime()+19800000)
   .toISOString().replace("Z","+05:30");
  const saved=await rescheduleTpoInterview(tpo,id,{...base,expectedUpdatedAt:offsetToken,localDateTime:localIst(target)});
  expect(saved.scheduledAt).toBe(new Date(localIst(target)+":00+05:30").toISOString());
  await expect(rescheduleTpoInterview(tpo,id,{...base,localDateTime:localIst(target)}))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_STALE"});
  const audit=await pool.query<{n:number}>(
   "SELECT count(*)::int n FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_TPO_INTERVIEW_RESCHEDULED'",[id]);
  expect(audit.rows[0]?.n).toBe(1);
  // The generic calendar writer must honor bookings made by the reschedule writer.
  await expect(actOnPlacementRound(tpo,ids.second!,{action:"SCHEDULE",
   scheduledAt:new Date(saved.scheduledAt!),timezone:"Asia/Kolkata",mode:"ON_CAMPUS",venue:" room a "}))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_VENUE_CONFLICT"});
  // A boundary-touching booking is not an overlap.
  const adjacent=await actOnPlacementRound(tpo,ids.second!,{action:"SCHEDULE",
   scheduledAt:new Date(new Date(saved.scheduledAt!).getTime()+3600000),
   timezone:"Asia/Kolkata",mode:"ON_CAMPUS",venue:"Room A"});
  expect(adjacent.status).toBe("SCHEDULED");
  const raceVenue="Race "+randomUUID();
  const raceLocal=localIst(new Date(target.getTime()+86400000));
  const competition=await Promise.allSettled([
   rescheduleTpoInterview(tpo,id,{...base,expectedUpdatedAt:saved.updatedAt,
    localDateTime:raceLocal,venue:raceVenue}),
   actOnPlacementRound(tpo,ids.second!,{action:"SCHEDULE",
    scheduledAt:new Date(raceLocal+":00+05:30"),timezone:"Asia/Kolkata",
    mode:"ON_CAMPUS",venue:raceVenue},adjacent.updatedAt.toISOString()),
  ]);
  expect(competition.filter(result=>result.status==="fulfilled")).toHaveLength(1);
  const denied=competition.find(result=>result.status==="rejected");
  expect(denied?.status==="rejected"?denied.reason:null)
   .toMatchObject({code:"PLACEMENT_ROUND_VENUE_CONFLICT"});
 });
});
