import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {deleteTpoUnpublishedDraft} from "@/modules/placements/tpo-delete-draft-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"tpo-draft-delete",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const insertedRoles:string[]=[];
type Fixture={companyId:string;relationshipId:string;jobId:string;roleId?:string;applicationId?:string};
async function fixture():Promise<Fixture>{
 if(!pool)throw Error("Isolated PostgreSQL required");
 const name="Unpublished "+randomUUID();
 const company=(await pool.query<{id:string}>("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",[name,SEED_IDS.facultyUser])).rows[0]!.id;
 const relationship=(await pool.query<{id:string}>("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",[SEED_IDS.collegeA,company,SEED_IDS.facultyUser])).rows[0]!.id;
 const job=(await pool.query<{id:string}>("INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,created_by_user_id) VALUES($1,$2,$3,$4,'Draft','FULL_TIME','ONSITE','INTERNAL','DRAFT',$5) RETURNING id",[SEED_IDS.collegeA,SEED_IDS.placementSeasonA,relationship,name,SEED_IDS.facultyUser])).rows[0]!.id;
 return {companyId:company,relationshipId:relationship,jobId:job};
}
async function cleanup(item:Fixture){
 if(!pool)return;
 if(item.applicationId){
  await pool.query("DELETE FROM placement_application_status_history WHERE application_id=$1",[item.applicationId]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[item.applicationId]);
 }
 if(item.roleId)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[item.roleId]);
 await pool.query("DELETE FROM in_app_notifications WHERE event_id IN (SELECT id FROM activity_events WHERE subject_id=$1)",[item.jobId]);
 await pool.query("DELETE FROM activity_events WHERE subject_id=$1",[item.jobId]);
 await pool.query("DELETE FROM placement_jobs WHERE id=$1",[item.jobId]);
 await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[item.relationshipId]);
 await pool.query("DELETE FROM placement_companies WHERE id=$1",[item.companyId]);
}
async function version(jobId:string){
 if(!pool)throw Error("Isolated PostgreSQL required");
 const r=await pool.query<{updated_at:Date}>("SELECT updated_at FROM placement_jobs WHERE id=$1",[jobId]);
 return r.rows[0]!.updated_at.toISOString();
}
describe.skipIf(!enabled)("TPO unpublished draft archive isolated PostgreSQL",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Isolated PostgreSQL required");
  const r=await pool.query<{id:string}>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[SEED_IDS.facultyCollegeAMembership]);
  if(r.rows[0]?.id)insertedRoles.push(r.rows[0].id);
 });
 afterAll(async()=>{
  if(pool){
   for(const id of insertedRoles)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
   await pool.end();
  }
  await closeDatabaseConnection();
 });
 it("TPO-drive-workspace-06 archives only empty unpublished drafts after scoped version and audit checks",async()=>{
  if(!pool)throw Error("Isolated PostgreSQL required");
  const row=await fixture();
  try{
   const current=await version(row.jobId);
   const stale=await deleteTpoUnpublishedDraft(tpo,row.jobId,
    {confirmed:true,expectedUpdatedAt:"2099-05-01T00:00:00Z"});
   expect(stale).toMatchObject({archived:false,reason:"STALE"});
   const saved=await deleteTpoUnpublishedDraft(tpo,row.jobId,
    {confirmed:true,expectedUpdatedAt:current});
   expect(saved.archived).toBe(true);
   const check=await pool.query<{status:string}>("SELECT status FROM placement_jobs WHERE id=$1",[row.jobId]);
   expect(check.rows[0]?.status).toBe("ARCHIVED");
   const audit=await pool.query<{n:number}>("SELECT count(*)::int AS n FROM activity_events WHERE subject_id=$1",[row.jobId]);
   expect(audit.rows[0]?.n).toBe(1);
  }finally{await cleanup(row)}
 });
 it("TPO-drive-workspace-R06 refuses an abandoned draft that already has an applicant",async()=>{
  if(!pool)throw Error("Isolated PostgreSQL required");
  const row=await fixture();
  try{
   row.roleId=(await pool.query<{id:string}>("INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",[row.jobId])).rows[0]!.id;
   row.applicationId=(await pool.query<{id:string}>("INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",[row.jobId,row.roleId,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
   const result=await deleteTpoUnpublishedDraft(tpo,row.jobId,
    {confirmed:true,expectedUpdatedAt:await version(row.jobId)});
   expect(result).toMatchObject({archived:false,reason:"HAS_HISTORY"});
   const state=await pool.query<{status:string}>("SELECT status FROM placement_jobs WHERE id=$1",[row.jobId]);
   expect(state.rows[0]?.status).toBe("DRAFT");
  }finally{await cleanup(row)}
 });
});
