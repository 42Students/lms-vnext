import { publishableJobTerms } from "../support/publishable-job-terms";
import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob} from "@/modules/placements/job-service";
import {publishPreparedPlacementJob} from "../support/publishable-job-fixture";
import {createPersistedJobRecruiter,persistedRecruiterContext} from "../support/persisted-job-recruiter-fixture";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {buildRecruiterToday} from "@/modules/placements/recruiter-today-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-today-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR Today PG scope",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Preserve fixtures referenced by append-only audit.
 it("surfaces authorized employer job only; foreign relationship, college and roles denied",async()=>{
  const nonce=randomUUID().slice(0,8);
  const company=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Today "+nonce,primaryDomain:nonce+".example"});
  const foreign=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Other "+nonce,primaryDomain:"other-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:company.relationship.id,
    title:"Today QA "+nonce,description:"Test job",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL",...publishableJobTerms});
  await publishPreparedPlacementJob(tpo,job.id,{round:{kind:"INTERVIEW",name:"Panel"}});
  const identityUid="hr-today-"+nonce;
  const recruiter=await createPersistedJobRecruiter({companyId:company.company.id,companyRelationshipId:company.relationship.id,
   collegeId:SEED_IDS.collegeA,jobId:job.id,grantedByUserId:tpo.user.id,identityUid});
  const ctx=(companyId:string,rel:string,collegeId:string):RequestContext=>persistedRecruiterContext({
   userId:recruiter.userId,identityUid,companyId,grantId:recruiter.grantId,collegeId,
   organizationId:SEED_IDS.organization,companyRelationshipId:rel});
  const own=await listOwnRecruiterPlacementJobs(ctx(company.company.id,company.relationship.id,SEED_IDS.collegeA));
  expect(buildRecruiterToday(own,[],SEED_IDS.collegeA,new Date()).live).toBeGreaterThanOrEqual(1);
  const alien=await listOwnRecruiterPlacementJobs(ctx(foreign.company.id,foreign.relationship.id,SEED_IDS.collegeA));
  expect(alien.some(item=>item.job.id===job.id)).toBe(false);
  const anotherCollege=await listOwnRecruiterPlacementJobs(ctx(company.company.id,company.relationship.id,SEED_IDS.collegeB));
  expect(anotherCollege.some(item=>item.job.id===job.id)).toBe(false);
  await expect(listOwnRecruiterPlacementJobs(tpo)).rejects.toBeDefined();
 });
});
