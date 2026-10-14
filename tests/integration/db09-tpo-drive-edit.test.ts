import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {editTpoDrive,getTpoDriveEditState} from "@/modules/placements/tpo-drive-edit-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-drive-edit",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;role?:string}={};
const roles:string[]=[];
async function fixture(){
 if(!pool)throw Error("Disposable PostgreSQL required");
 const title="Edit "+randomUUID();
 ids.company=(await pool.query<{id:string}>(
  "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
  [title,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.relationship=(await pool.query<{id:string}>(
  "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
  [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,created_by_user_id) VALUES($1,$2,$3,$4,'Original','FULL_TIME','ONSITE','INTERNAL','DRAFT',$5) RETURNING id",
  [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,title,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.role=(await pool.query<{id:string}>(
  "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,$2,'FULL_TIME','ONSITE',true) RETURNING id",
  [ids.job,title])).rows[0]!.id;
 await pool.query("UPDATE placement_jobs SET updated_at=date_trunc('milliseconds',updated_at)+interval '123 microseconds' WHERE id=$1",[ids.job]);
 return ids.job;
}
function payload(expectedUpdatedAt:string){return {
 confirmed:true,expectedUpdatedAt,reason:"Updating open job information",
 title:"Updated "+randomUUID(),description:"Updated responsibilities",
 locations:["Hyderabad"],openings:3,minimumAnnualCtcInr:500000,maximumAnnualCtcInr:900000,
};}
describe.skipIf(!enabled)("TPO draft edit isolated PostgreSQL",()=>{
 beforeAll(async()=>{if(!pool)throw Error("PG required");
  for(const membershipId of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const row=await pool.query<{id:string}>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
    [membershipId]);if(row.rows[0]?.id)roles.push(row.rows[0].id);
  }
 });
 afterAll(async()=>{if(pool){
  if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
  if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
  if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
  if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
  for(const id of roles)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
  await pool.end();
 }await closeDatabaseConnection();});
 it("edits a SQL-default-microsecond job and audits; rejects stale, foreign and wrong-role",async()=>{
  if(!pool)throw Error("PG required");
  const id=await fixture(),state=await getTpoDriveEditState(tpo,id);
  // The public boundary accepts offset ISO tokens; equivalent instants must pass CAS.
  const offsetToken=new Date(new Date(state.updatedAt).getTime()+19800000)
   .toISOString().replace("Z","+05:30");
  const saved=await editTpoDrive(tpo,id,payload(offsetToken));
  expect(saved.updatedAt).not.toBe(state.updatedAt);
  const primary=await pool.query<{openings:number}>("SELECT openings FROM placement_job_role_options WHERE id=$1",[ids.role]);
  expect(primary.rows[0]?.openings).toBe(3);
  await expect(editTpoDrive(tpo,id,payload(state.updatedAt))).rejects.toMatchObject({code:"PLACEMENT_JOB_STALE"});
  const audit=await pool.query<{count:number}>(
   "SELECT count(*)::int AS count FROM activity_events WHERE subject_id=$1 AND event_type='PLACEMENTS_TPO_DRIVE_EDITED'",[id]);
  expect(audit.rows[0]?.count).toBe(1);
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,
   id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(editTpoDrive(foreign,id,payload(saved.updatedAt))).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(editTpoDrive(wrong,id,payload(saved.updatedAt))).rejects.toBeInstanceOf(AuthorizationError);
 });
});
