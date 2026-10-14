import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoDriveDeadlineState,extendTpoDriveDeadline} from "@/modules/placements/tpo-drive-deadline-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-deadline",
 platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,
 collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string}={};const roles:string[]=[];
async function fixture(){
 if(!pool)throw Error("Disposable DB required");const name="Deadline "+randomUUID();
 ids.company=(await pool.query<{id:string}>(
  "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
  [name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.relationship=(await pool.query<{id:string}>(
  "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
  [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,application_deadline,created_by_user_id) VALUES($1,$2,$3,$4,'Deadline fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),now()+interval '2 days',$5) RETURNING id",
  [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,name,SEED_IDS.facultyUser])).rows[0]!.id;
 await pool.query("UPDATE placement_jobs SET updated_at=date_trunc('milliseconds',updated_at)+interval '237 microseconds' WHERE id=$1",[ids.job]);
 return ids.job;
}
function payload(token:string,date:string){return {confirmed:true,expectedUpdatedAt:token,
 reason:"Company requested later deadline",newDeadlineIso:date};}
describe.skipIf(!enabled)("TPO deadline extension isolated PostgreSQL",()=>{
 beforeAll(async()=>{if(!pool)throw Error("PG required");
  for(const membershipId of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const inserted=await pool.query<{id:string}>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[membershipId]);
   if(inserted.rows[0]?.id)roles.push(inserted.rows[0].id);
  }
 });
 afterAll(async()=>{if(pool){
  if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
  if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
  if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
  for(const id of roles)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
  await pool.end();
 }await closeDatabaseConnection();});
 it("extends real SQL-default date with audited CAS; denies stale/foreign/wrong role",async()=>{
  if(!pool)throw Error("PG required");
  const jobId=await fixture(),state=await getTpoDriveDeadlineState(tpo,jobId);
  if(!state.applicationDeadline)throw Error("Fixture missing deadline");
  const later=new Date(new Date(state.applicationDeadline).getTime()+2*86400000).toISOString();
  const offsetToken=new Date(new Date(state.updatedAt).getTime()+19800000)
   .toISOString().replace("Z","+05:30");
  const result=await extendTpoDriveDeadline(tpo,jobId,payload(offsetToken,later));
  expect(result.applicationDeadline).toBe(later);
  await expect(extendTpoDriveDeadline(tpo,jobId,payload(state.updatedAt,later)))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_STALE"});
  await expect(extendTpoDriveDeadline(tpo,jobId,payload(result.updatedAt,later)))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_INVALID_DEADLINE"});
  const audit=await pool.query<{count:number}>(
   "SELECT count(*)::int AS count FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_TPO_DRIVE_DEADLINE_EXTENDED'",[jobId]);
  expect(audit.rows[0]?.count).toBe(1);
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,
   id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(extendTpoDriveDeadline(foreign,jobId,payload(result.updatedAt,later)))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(extendTpoDriveDeadline(wrong,jobId,payload(result.updatedAt,later)))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
