import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoDriveApplicationsExport} from "@/modules/placements/tpo-drive-applications-export-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"tpo-app-export",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
const ids:{company?:string;relationship?:string;job?:string;role?:string;application?:string}={};const roleIds:string[]=[];
async function fixture(){
 if(!pool)throw Error("Disposable PG required");const name="Export "+randomUUID();
 ids.company=(await pool.query<{id:string}>(
  "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
  [name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.relationship=(await pool.query<{id:string}>(
  "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
  [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.job=(await pool.query<{id:string}>(
  "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES($1,$2,$3,$4,'Export fixture','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$5) RETURNING id",
  [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,name,SEED_IDS.facultyUser])).rows[0]!.id;
 ids.role=(await pool.query<{id:string}>(
  "INSERT INTO placement_job_role_options(job_id,title,employment_type,work_mode,is_primary) VALUES($1,'=FORMULA(1)','FULL_TIME','ONSITE',true) RETURNING id",
  [ids.job])).rows[0]!.id;
 ids.application=(await pool.query<{id:string}>(
  "INSERT INTO placement_applications(job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) RETURNING id",
  [ids.job,ids.role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser])).rows[0]!.id;
 await pool.query("INSERT INTO placement_application_screenings(application_id) VALUES($1)",[ids.application]);
 return ids.job;
}
async function cleanup(){
 if(!pool)return;
 if(ids.application){
  await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[ids.application]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.application]);
 }
 if(ids.role)await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.role]);
 if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
 if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
 if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
}
describe.skipIf(!enabled)("TPO scoped application export PostgreSQL",()=>{
 beforeAll(async()=>{if(!pool)throw Error("PG required");
  for(const id of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const row=await pool.query<{id:string}>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",[id]);
   if(row.rows[0]?.id)roleIds.push(row.rows[0].id);
  }
 });
 afterAll(async()=>{await cleanup();if(pool){for(const id of roleIds)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
  await pool.end();}await closeDatabaseConnection();});
 it("includes persisted scoped applications, neutralizes formula and denies foreign/wrong role",async()=>{
  if(!pool)throw Error("PG required");
  const jobId=await fixture();
  const report=await getTpoDriveApplicationsExport(tpo,{jobId});
  expect(report.rows.find(row=>row.applicationId===ids.application)?.status).toBe("SUBMITTED");
  expect(report.csv).toContain("'=FORMULA(1)");
  const full=await getTpoDriveApplicationsExport(tpo,{jobId},{exportAll:true});
  expect(full.truncated).toBe(false);
  expect(full.rows).toHaveLength(1);
  expect(full.csv).toContain("Roll number");
  expect(full.csv).toContain("Email");
  expect(full.csv).toContain("Phone");
  expect((await getTpoDriveApplicationsExport(tpo,{jobId,stage:"PENDING",search:"FORMULA"})).rows).toHaveLength(1);
  // Registration number is distinct from roll and must work in the same
  // tenant-scoped CSV source as the live applicant pipeline.
  const registration="REG"+randomUUID().replaceAll("-","");
  const previousProfile=await pool.query<{registration_number:string|null}>(
    "SELECT registration_number FROM learner_profiles WHERE membership_id=$1",
    [SEED_IDS.learnerCollegeAMembership],
  );
  await pool.query(
    "INSERT INTO learner_profiles(membership_id,registration_number) VALUES($1,$2) ON CONFLICT(membership_id) DO UPDATE SET registration_number=EXCLUDED.registration_number",
    [SEED_IDS.learnerCollegeAMembership,registration],
  );
  try {
    const byRegistration=await getTpoDriveApplicationsExport(tpo,{jobId,search:registration});
    expect(byRegistration.rows.map(row=>row.applicationId)).toEqual([ids.application]);
    expect(byRegistration.csv).toContain("Roll number");
  }finally{
    if(previousProfile.rows.length)await pool.query(
      "UPDATE learner_profiles SET registration_number=$1 WHERE membership_id=$2",
      [previousProfile.rows[0]?.registration_number??null,SEED_IDS.learnerCollegeAMembership],
    );
    else await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",
      [SEED_IDS.learnerCollegeAMembership]);
  }
  expect((await getTpoDriveApplicationsExport(tpo,{jobId,stage:"REJECTED"})).rows).toHaveLength(0);
  expect((await getTpoDriveApplicationsExport(tpo,{jobId,search:"%"})).rows).toHaveLength(0);
  await pool.query("UPDATE placement_applications SET status='WITHDRAWN',withdrawn_at=now() WHERE id=$1",[ids.application]);
  expect((await getTpoDriveApplicationsExport(tpo,{jobId,stage:"PENDING"})).rows).toHaveLength(0);
  expect((await getTpoDriveApplicationsExport(tpo,{jobId,stage:"WITHDRAWN"})).rows).toHaveLength(1);
  const foreign:RequestContext={...tpo,membership:{...tpo.membership!,
   id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
  await expect(getTpoDriveApplicationsExport(foreign,{jobId}))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  const wrong:RequestContext={...tpo,membership:{...tpo.membership!,roles:["LEARNER"]}};
  await expect(getTpoDriveApplicationsExport(wrong,{jobId}))
   .rejects.toBeInstanceOf(AuthorizationError);
 });
});
