import { publishableJobTerms } from "../support/publishable-job-terms";
import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob} from "@/modules/placements/job-service";
import {publishPreparedPlacementJob} from "../support/publishable-job-fixture";
import {createPersistedJobRecruiter,persistedRecruiterContext} from "../support/persisted-job-recruiter-fixture";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {buildRecruiterCompanyOverview} from "@/modules/placements/recruiter-company-overview-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-profile-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR company profile PG isolation",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Preserve audit-referenced fixtures.
 it("builds employer profile footprint without foreign-company or foreign-college rows",async()=>{
  const nonce=randomUUID().slice(0,8);
  const company=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Profile "+nonce,primaryDomain:nonce+".example"});
  const other=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Profile Other "+nonce,primaryDomain:"else-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:company.relationship.id,
   title:"Profile Hiring "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL",...publishableJobTerms});
  await publishPreparedPlacementJob(tpo,job.id);
  const identityUid="hr-profile-"+nonce;
  const recruiter=await createPersistedJobRecruiter({companyId:company.company.id,companyRelationshipId:company.relationship.id,
    collegeId:SEED_IDS.collegeA,jobId:job.id,grantedByUserId:tpo.user.id,identityUid});
  const hr=(companyId:string,relation:string,collegeId:string):RequestContext=>persistedRecruiterContext({
    userId:recruiter.userId,identityUid,companyId,grantId:recruiter.grantId,collegeId,
    organizationId:SEED_IDS.organization,companyRelationshipId:relation});
  const own=await listOwnRecruiterPlacementJobs(hr(company.company.id,company.relationship.id,SEED_IDS.collegeA));
  expect(buildRecruiterCompanyOverview(own,SEED_IDS.collegeA,company.relationship.id).recent.some(row=>row.id===job.id)).toBe(true);
  const foreign=await listOwnRecruiterPlacementJobs(hr(other.company.id,other.relationship.id,SEED_IDS.collegeA));
  expect(foreign.some(row=>row.job.id===job.id)).toBe(false);
  const foreignCollege=await listOwnRecruiterPlacementJobs(hr(company.company.id,company.relationship.id,SEED_IDS.collegeB));
  expect(foreignCollege.some(row=>row.job.id===job.id)).toBe(false);
  await expect(listOwnRecruiterPlacementJobs(tpo)).rejects.toBeDefined();
 });
});
