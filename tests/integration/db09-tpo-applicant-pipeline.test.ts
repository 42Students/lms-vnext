import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoApplicantPipeline} from "@/modules/placements/tpo-applicant-pipeline-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-applicant-pipeline",
platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;rel?:string;job?:string;role?:string;app?:string}={};const addedTpoRoleIds:string[]=[];
const extraApps:string[]=[],extraMembers:string[]=[],extraUsers:string[]=[];
async function fixture(){
 if(!pool)throw Error("isolated DB required");
 const name="Pipeline-"+randomUUID();
 ids.company=(await pool.query<{id:string}>("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",[name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.rel=(await pool.query<{id:string}>("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",[SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>("INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,created_by_user_id) VALUES($1,$2,$3,$4,'Description','FULL_TIME','ONSITE','INTERNAL','DRAFT',$5) RETURNING id",[SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.rel,name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.role=(await pool.query<{id:string}>("INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'Main','FULL_TIME','ONSITE',true) RETURNING id",[ids.job])).rows[0]!.id;
 ids.app=(await pool.query<{id:string}>("INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",[ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
 return ids.job!;
}
async function cleanup(){
 if(!pool)return;
 if(ids.app)await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.app]);
 for(const id of extraApps)await pool.query("DELETE FROM placement_applications WHERE id=$1",[id]);
 // These read-only learner fixtures never receive activity_events references.
 for(const id of extraMembers)await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",[id]);
 for(const id of extraMembers){await pool.query("DELETE FROM membership_roles WHERE membership_id=$1",[id]);
  await pool.query("DELETE FROM college_memberships WHERE id=$1",[id]);}
 for(const id of extraUsers)await pool.query("DELETE FROM users WHERE id=$1",[id]);
 if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.rel)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.rel]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}
describe.skipIf(!enabled)("TPO applicant pipeline isolated PostgreSQL",()=>{
beforeAll(async()=>{
 if(!pool)throw Error("Isolated PostgreSQL required");
 for(const membershipId of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
  const inserted=await pool.query<{id:string}>(
   "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
   [membershipId]);
  if(inserted.rows[0]?.id)addedTpoRoleIds.push(inserted.rows[0].id);
 }
});
afterAll(async()=>{
 await cleanup();
 if(pool)for(const id of addedTpoRoleIds)
  await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
 await pool?.end();
 await closeDatabaseConnection();
});
it("reads persisted pending applicants and denies foreign college / wrong role",async()=>{
if(!pool)throw Error("PG required");
const jobId=await fixture();
const result=await getTpoApplicantPipeline(tpo,{jobId,stage:"PENDING"});
const recentlySubmitted=await getTpoApplicantPipeline(tpo,{jobId,submittedWithin:"LAST_7_DAYS"});
expect(recentlySubmitted.rows.some(row=>row.id===ids.app)).toBe(true);
const ownEvidence=await getTpoApplicantPipeline(tpo,{jobId,eligibility:"ELIGIBLE"});
expect(ownEvidence.rows.some(r=>r.id===ids.app)).toBe(true);
expect((await getTpoApplicantPipeline(tpo,{jobId,eligibility:"ELIGIBLE_WITH_MISSING_EVIDENCE"})).rows.some(r=>r.id===ids.app)).toBe(false);
const ownChannel=await getTpoApplicantPipeline(tpo,{jobId,channel:"INTERNAL"});
expect(ownChannel.rows.some(r=>r.id===ids.app)).toBe(true);
expect((await getTpoApplicantPipeline(tpo,{jobId,channel:"EXTERNAL"})).rows.some(r=>r.id===ids.app)).toBe(false);
expect(result.rows.some(r=>r.id===ids.app)).toBe(true);
for(let i=0;i<25;i++){
 const user=(await pool.query<{id:string}>("INSERT INTO users(identity_uid,display_name) VALUES($1,$2) RETURNING id",
  ["pipeline-page-"+randomUUID(),"Pipeline candidate "+i])).rows[0]!.id;extraUsers.push(user);
 const member=(await pool.query<{id:string}>("INSERT INTO college_memberships(user_id,college_id) VALUES($1,$2) RETURNING id",
  [user,SEED_IDS.collegeA])).rows[0]!.id;extraMembers.push(member);
 await pool.query("INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER')",[member]);
 const app=(await pool.query<{id:string}>("INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
  [jobId,ids.role,member,user])).rows[0]!.id;extraApps.push(app);
}
// The original TPO prototype can find a student by their separate saved
// registration number, not only by roll number or email.
const registration="REG"+randomUUID().replaceAll("-","");
await pool.query("INSERT INTO learner_profiles(membership_id,registration_number) VALUES($1,$2)",
 [extraMembers[0],registration]);
const byRegistration=await getTpoApplicantPipeline(tpo,{jobId,search:registration});
expect(byRegistration.rows.map(row=>row.id)).toContain(extraApps[0]);
expect(byRegistration.totalMatching).toBe(1);
const alphabetical=await getTpoApplicantPipeline(tpo,{jobId,stage:"PENDING",sort:"LEARNER_NAME",page:1});
expect(alphabetical.rows.length).toBeGreaterThan(0);
expect(alphabetical.rows.map(row=>row.student??"").slice(0,2)).toEqual([...alphabetical.rows.map(row=>row.student??"").slice(0,2)].sort());
const first=await getTpoApplicantPipeline(tpo,{jobId,stage:"PENDING",page:1});
const second=await getTpoApplicantPipeline(tpo,{jobId,stage:"PENDING",page:2});
expect(first.rows).toHaveLength(25);expect(second.rows).toHaveLength(1);
expect(first.counts.pending).toBe(26);expect(second.totalMatching).toBe(26);
expect(new Set([...first.rows,...second.rows].map(row=>row.id)).size).toBe(26);
expect((await getTpoApplicantPipeline(tpo,{jobId,stage:"PENDING",page:999})).page).toBe(2);
expect((await getTpoApplicantPipeline(tpo,{jobId,search:"%"})).rows).toHaveLength(0);
await pool.query("UPDATE placement_applications SET status='WITHDRAWN',withdrawn_at=now() WHERE id=$1",[extraApps[0]]);
const withdrawn=await getTpoApplicantPipeline(tpo,{jobId,stage:"WITHDRAWN"});
expect(withdrawn.rows.map(row=>row.id)).toEqual([extraApps[0]]);
expect(withdrawn.counts.pending).toBe(25);
const foreign:RequestContext={...tpo,membership:{...tpo.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
await expect(getTpoApplicantPipeline(foreign,{jobId})).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
const forged:RequestContext={...tpo,membership:{...tpo.membership!,id:SEED_IDS.learnerCollegeAMembership}};
await expect(getTpoApplicantPipeline(forged,{jobId})).rejects.toBeInstanceOf(AuthorizationError);
const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
await expect(getTpoApplicantPipeline(wrong,{jobId})).rejects.toBeInstanceOf(AuthorizationError);
});
});
