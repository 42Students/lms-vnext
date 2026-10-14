import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoInterviewReadiness} from "@/modules/placements/tpo-interview-readiness-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-interview-readiness",platformStatus:"ACTIVE",systemRoles:[]},
membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;rel?:string;job?:string;round?:string}={};let roleId:string|null=null;
async function fixture(){
 if(!pool)throw Error("DB required");const token=randomUUID();
 ids.company=(await pool.query<{id:string}>("INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",["Interview "+token,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.rel=(await pool.query<{id:string}>("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",[SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>("INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Interview fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",[SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.rel,"Interview "+token,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.round=(await pool.query<{id:string}>("INSERT INTO placement_job_rounds(job_id,sequence,kind,name,created_by_user_id,status,scheduled_at,timezone,mode,venue,duration_minutes) VALUES($1,1,'INTERVIEW','HR Round',$2,'SCHEDULED',now()+interval '1 day','Asia/Kolkata','ON_CAMPUS','Hall',60) RETURNING id",[ids.job,SEED_IDS.facultyUser])).rows[0]!.id;
 return ids.round!;
}
async function cleanup(){if(!pool)return;
 if(ids.round)await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[ids.round]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.rel)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.rel]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);}
describe.skipIf(!enabled)("TPO interview readiness scoped PostgreSQL",()=>{
 beforeAll(async()=>{if(!pool)throw Error("DB required");roleId=(await pool.query<{id:string}>("INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[SEED_IDS.facultyCollegeAMembership])).rows[0]?.id??null;});
 afterAll(async()=>{await cleanup();if(roleId&&pool)await pool.query("DELETE FROM membership_roles WHERE id=$1",[roleId]);await pool?.end();await closeDatabaseConnection();});
 it("projects scheduled interview without crossing college/role scope",async()=>{
 const id=await fixture();const own=await getTpoInterviewReadiness(tpo,{days:7});
 expect(own.rows.find(r=>r.id===id)?.state).toBe("UPCOMING");
 const foreign:RequestContext={...tpo,membership:{...tpo.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
 expect((await getTpoInterviewReadiness(foreign,{days:7})).rows.some(r=>r.id===id)).toBe(false);
 const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
 await expect(getTpoInterviewReadiness(wrong,{days:7})).rejects.toBeInstanceOf(AuthorizationError);
 });
});
