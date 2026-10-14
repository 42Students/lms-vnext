import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
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
    title:"Allowed "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"REMOTE",applicationMode:"INTERNAL"});
  const second=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:other.relationship.id,
    title:"Private "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"REMOTE",applicationMode:"INTERNAL"});
  await publishPlacementJob(tpo,first.id);await publishPlacementJob(tpo,second.id);
  const uid=randomUUID();
  const grants=[own.relationship,other.relationship].map((rel,i)=>({id:randomUUID(),collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:rel.id}));
  const hr:RequestContext={user:{id:uid,identityUid:"hr-boundary-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:uid,companyId:own.company.id,companyName:own.company.name,title:null,status:"ACTIVE",grants}};
  const rows=await listOwnRecruiterPlacementJobs(hr);
  expect(rows.some(row=>row.job.id===first.id)).toBe(true);
  expect(rows.some(row=>row.job.id===second.id)).toBe(false);
  await expect(listOwnRecruiterPlacementJobs(tpo)).rejects.toBeDefined();
 });
});
