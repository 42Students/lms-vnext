import { publishableJobTerms } from "../support/publishable-job-terms";
import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob} from "@/modules/placements/job-service";
import {publishPreparedPlacementJob} from "../support/publishable-job-fixture";
import {createPersistedJobRecruiter} from "../support/persisted-job-recruiter-fixture";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-company-boundary-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR forged cross-company grant is non-leaking",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Activity references fixtures.
 it("returns own job but not a different company's job even with both relationship grants",async()=>{
  const nonce=randomUUID().slice(0,8);
  const own=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Boundary Own "+nonce,primaryDomain:"guardown-"+nonce+".example"});
  const other=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Boundary Other "+nonce,primaryDomain:"guardother-"+nonce+".example"});
  const first=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:own.relationship.id,
    title:"Allowed "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"REMOTE",applicationMode:"INTERNAL",...publishableJobTerms});
  const second=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:other.relationship.id,
    title:"Private "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"REMOTE",applicationMode:"INTERNAL",...publishableJobTerms});
  for(const job of [first,second]){
   await publishPreparedPlacementJob(tpo,job.id,{round:{kind:"INTERVIEW",name:"Technical evaluation"}});
  }
  // Persist only the legitimate own-company recruiter state. The second
  // relationship grant stays forged (session-only): it must never leak.
  const identityUid="hr-boundary-"+nonce;
  const recruiter=await createPersistedJobRecruiter({companyId:own.company.id,companyRelationshipId:own.relationship.id,
    collegeId:SEED_IDS.collegeA,jobId:first.id,grantedByUserId:tpo.user.id,identityUid});
  const grants=[
   {id:recruiter.grantId,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    collegeName:"Fixture",companyRelationshipId:own.relationship.id},
   {id:randomUUID(),collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    collegeName:"Fixture",companyRelationshipId:other.relationship.id},
  ];
  const hr:RequestContext={user:{id:recruiter.userId,identityUid,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:recruiter.userId,companyId:own.company.id,companyName:own.company.name,title:null,status:"ACTIVE",grants}};
  const rows=await listOwnRecruiterPlacementJobs(hr);
  expect(rows.some(row=>row.job.id===first.id)).toBe(true);
  expect(rows.some(row=>row.job.id===second.id)).toBe(false);
  await expect(listOwnRecruiterPlacementJobs(tpo)).rejects.toBeDefined();
 });
});
