import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {createPlacementRound} from "@/modules/placements/round-service";
import {getRecruiterPlacementWorkspace} from "@/modules/placements/recruiter-workspace-service";
import {projectRecruiterRoundResults} from "@/modules/placements/recruiter-round-results-read-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-results-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR round table non-enumeration PG",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Append-only activity holds references to fixtures.
 it("reads only own published job rounds and masks wrong company/college/role",async()=>{
  const nonce=randomUUID().slice(0,8);
  const own=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Rounds "+nonce,primaryDomain:nonce+".example"});
  const foreign=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Rounds Foreign "+nonce,primaryDomain:"foreign-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:own.relationship.id,
   title:"Round Review "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
  const round=await createPlacementRound(tpo,job.id,{kind:"TEST",name:"Aptitude"});
  await publishPlacementJob(tpo,job.id);
  const uid=randomUUID();
  const hr=(companyId:string,relation:string,collegeId:string):RequestContext=>({
   user:{id:uid,identityUid:"hr-results-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:uid,companyId,companyName:"Fixture",status:"ACTIVE",title:null,
    grants:[{id:randomUUID(),collegeId,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:relation}]}
  });
  const workspace=await getRecruiterPlacementWorkspace(hr(own.company.id,own.relationship.id,SEED_IDS.collegeA),job.id);
  const result=projectRecruiterRoundResults(workspace.rounds,round.id,"ALL");
  expect(result?.round.name).toBe("Aptitude");
  expect(result?.counts).toMatchObject({all:0,recorded:0});
  await expect(getRecruiterPlacementWorkspace(hr(foreign.company.id,foreign.relationship.id,SEED_IDS.collegeA),job.id))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getRecruiterPlacementWorkspace(hr(own.company.id,own.relationship.id,SEED_IDS.collegeB),job.id))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getRecruiterPlacementWorkspace(tpo,job.id)).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
 });
});
