import { publishableJobTerms } from "../support/publishable-job-terms";
import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob} from "@/modules/placements/job-service";
import {publishPreparedPlacementJob} from "../support/publishable-job-fixture";
import {createPersistedJobRecruiter,persistedRecruiterContext} from "../support/persisted-job-recruiter-fixture";
import {getHrJobRead} from "@/modules/placements/hr-job-read-service";
import {buildHrOfferCsv} from "@/modules/placements/hr-offer-export-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-offer-csv-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR offer CSV exact company read",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("emits own eligible job export without foreign-company disclosure",async()=>{
  const n=randomUUID().slice(0,8);
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"OfferCsv Own "+n,primaryDomain:"ocown-"+n+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"OfferCsv Foreign "+n,primaryDomain:"ocother-"+n+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:a.relationship.id,
   title:"OfferCsv "+n,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL",...publishableJobTerms});
  await publishPreparedPlacementJob(tpo,job.id);
  const identityUid="hr-oc-"+n;
  const recruiter=await createPersistedJobRecruiter({companyId:a.company.id,companyRelationshipId:a.relationship.id,
   collegeId:SEED_IDS.collegeA,jobId:job.id,grantedByUserId:tpo.user.id,identityUid});
  const hr=(companyId:string,rel:string):RequestContext=>persistedRecruiterContext({
   userId:recruiter.userId,identityUid,companyId,grantId:recruiter.grantId,collegeId:SEED_IDS.collegeA,
   organizationId:SEED_IDS.organization,companyRelationshipId:rel});
  const own=await getHrJobRead(hr(a.company.id,a.relationship.id),job.id,{tab:"offers"});
  expect(buildHrOfferCsv(own.offers,own.offersPage.total).exported).toBe(0);
  await expect(getHrJobRead(hr(b.company.id,b.relationship.id),job.id,{tab:"offers"}))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getHrJobRead(tpo,job.id,{tab:"offers"})).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
 });
});
