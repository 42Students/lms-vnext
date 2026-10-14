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
const ids:{company?:string;rel?:string;job?:string;role?:string;app?:string}={};let tpoRole:string|null=null;
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
 if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.rel)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.rel]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}
describe.skipIf(!enabled)("TPO applicant pipeline isolated PostgreSQL",()=>{
beforeAll(async()=>{if(!pool)throw Error("DB required");const r=await pool.query<{id:string}>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[SEED_IDS.facultyCollegeAMembership]);tpoRole=r.rows[0]?.id??null;});
afterAll(async()=>{await cleanup();if(pool&&tpoRole)await pool.query("DELETE FROM membership_roles WHERE id=$1",[tpoRole]);await pool?.end();await closeDatabaseConnection();});
it("reads persisted pending applicants and denies foreign college / wrong role",async()=>{
const jobId=await fixture();
const result=await getTpoApplicantPipeline(tpo,{jobId,stage:"PENDING"});
expect(result.rows.some(r=>r.id===ids.app)).toBe(true);
const foreign:RequestContext={...tpo,membership:{...tpo.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
await expect(getTpoApplicantPipeline(foreign,{jobId})).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
await expect(getTpoApplicantPipeline(wrong,{jobId})).rejects.toBeInstanceOf(AuthorizationError);
});
});
