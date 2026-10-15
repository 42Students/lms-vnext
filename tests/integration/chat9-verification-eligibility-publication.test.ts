import {randomUUID} from "node:crypto";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {eq} from "drizzle-orm";
import {profileVerifications} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {publishVerifiedEducation} from "@/modules/profile-verification/academic-publication";
import {
 evaluatePlacementEligibility,upsertJobEligibilityPolicy,
} from "@/modules/placements/eligibility-service";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob} from "@/modules/placements/job-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL) &&
 process.env.DB03_ISOLATED_TEST_DATABASE==="1" &&
 process.env.DB04_VERIFICATION_READY==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL}):null;
const ids={user:randomUUID(),member:randomUUID(),role:randomUUID(),record:randomUUID()};
const tpo:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["FACULTY","MENTOR","TPO"]},
};
let jobId:string,companyId:string,relationshipId:string;
const edu=(tenth:string,pg:boolean)=>({
 education:[
  {id:randomUUID(),educationType:"10th",grade:tenth,gradingType:"Percentage",max:"100",endYear:"2015"},
  {id:randomUUID(),educationType:"12th",grade:"80",gradingType:"Percentage",max:"100",endYear:"2017"},
  {id:randomUUID(),educationType:"UG",grade:"75",gradingType:"Percentage",max:"100",endYear:"2021"},
  ...(pg?[{id:randomUUID(),educationType:"PG",grade:"81",gradingType:"Percentage",max:"100",endYear:"2023"}]:[]),
 ],
});
async function publish(snapshot:ReturnType<typeof edu>,version:number){
 await getDb().transaction(async tx=>{
  // Simulate the same atomic verified snapshot + publication write as the
  // real verification transaction writer, without bypassing any cache.
  await tx.update(profileVerifications).set({
   submittedSnapshot:snapshot,verifiedSnapshot:snapshot,
   rowVersion:version,verifiedAt:new Date(),
  }).where(eq(profileVerifications.id,ids.record));
  await publishVerifiedEducation(tx,{
   verificationId:ids.record,membershipId:ids.member,collegeId:SEED_IDS.collegeA,
   verifiedSnapshot:snapshot,version,reviewerId:SEED_IDS.facultyUser,verifiedAt:new Date(),
  });
 });
}
describe.skipIf(!enabled)("T-S2-09 verified publication refreshes real eligibility",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Disposable DB04 database is required");
  await pool.query("insert into users(id,identity_uid,display_name) values($1::uuid,$2::text,$3::text)",
   [ids.user,"verified-publish-"+ids.user,"Verified publishing learner"]);
  await pool.query("insert into college_memberships(id,user_id,college_id) values($1::uuid,$2::uuid,$3::uuid)",
   [ids.member,ids.user,SEED_IDS.collegeA]);
  await pool.query("insert into membership_roles(id,membership_id,role) values($1::uuid,$2::uuid,'LEARNER')",
   [ids.role,ids.member]);
  const first=edu("90",true);
  await pool.query(`insert into profile_verifications
   (id,learner_membership_id,section,status,submitted_snapshot,verified_snapshot,
    submitted_at,verified_at,row_version)
   values($1::uuid,$2::uuid,'EDUCATION','VERIFIED',$3::jsonb,$3::jsonb,now(),now(),1)`,
   [ids.record,ids.member,JSON.stringify(first)]);
  const company=await createPlacementCompany(tpo,{
   collegeId:SEED_IDS.collegeA,name:"Verified grade "+ids.record.slice(0,8),
   primaryDomain:"verified-"+ids.record.slice(0,8)+".example",
  });
  companyId=company.company.id;
  relationshipId=company.relationship.id;
  const job=await createPlacementJob(tpo,{
   collegeId:SEED_IDS.collegeA,companyRelationshipId:relationshipId,
   title:"Verified grade test",description:"Disposable eligibility test",
   employmentType:"FULL_TIME",workMode:"HYBRID",
   locations:["Hyderabad"],applicationMode:"INTERNAL",
  });
  jobId=job.id;
  await upsertJobEligibilityPolicy(tpo,jobId,{minTenthPercentage:60});
 });
 afterAll(async()=>{
  try{
   if(pool){
    if(jobId){
     await pool.query("delete from placement_job_eligibility_policies where job_id=$1::uuid",[jobId]);
     await pool.query("delete from placement_jobs where id=$1::uuid",[jobId]);
    }
    if(relationshipId)
     await pool.query("delete from placement_company_relationships where id=$1::uuid",[relationshipId]);
    if(companyId)
     await pool.query("delete from placement_companies where id=$1::uuid",[companyId]);
    await pool.query("delete from profile_verification_academic_marks where learner_membership_id=$1::uuid",[ids.member]);
    await pool.query("delete from placement_candidate_academic_evidence where membership_id=$1::uuid",[ids.member]);
    await pool.query("delete from profile_verification_events where verification_id=$1::uuid",[ids.record]);
    await pool.query("delete from profile_verifications where id=$1::uuid",[ids.record]);
    await pool.query("delete from membership_roles where id=$1::uuid",[ids.role]);
    await pool.query("delete from college_memberships where id=$1::uuid",[ids.member]);
    await pool.query("delete from users where id=$1::uuid",[ids.user]);
   }
  }finally{await pool?.end();await closeDatabaseConnection();}
 });
 it("recomputes after approval, removes stale levels, and changes policy result",async()=>{
  await publish(edu("90",true),1);
  const first=await evaluatePlacementEligibility(tpo,jobId,ids.member);
  expect(first.status).toBe("ELIGIBLE");
  await publish(edu("45",false),2);
  const second=await evaluatePlacementEligibility(tpo,jobId,ids.member);
  expect(second.status).toBe("INELIGIBLE");
  expect(second.checks).toEqual(expect.arrayContaining([
   expect.objectContaining({criterion:"10th percentage",status:"FAIL"}),
  ]));
  const marks=await pool!.query(
   "select level,source_snapshot_version from profile_verification_academic_marks where learner_membership_id=$1::uuid",
   [ids.member]);
  expect(marks.rows.some(x=>x.level==="PG")).toBe(false);
  expect(marks.rows.every(x=>x.source_snapshot_version===2)).toBe(true);
  const evidence=await pool!.query(
   "select tenth_pct_basis_points,source from placement_candidate_academic_evidence where membership_id=$1::uuid",
   [ids.member]);
  expect(evidence.rows[0]).toMatchObject({tenth_pct_basis_points:4500,source:"VERIFIED"});
 });
});
