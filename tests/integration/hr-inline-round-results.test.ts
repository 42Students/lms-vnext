import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {createPlacementRound} from "@/modules/placements/round-service";
import {getHrJobRead} from "@/modules/placements/hr-job-read-service";
import {projectRecruiterRoundResults} from "@/modules/placements/recruiter-round-results-read-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-inline-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR inline result read auth (isolated PG)",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Append-only audit references fixtures.
 it("reads own rounds but masks foreign employer / college / wrong role before projection",async()=>{
  const nonce=randomUUID().slice(0,8);
  const own=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Inline Own "+nonce,primaryDomain:"inown-"+nonce+".example"});
  const other=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Inline Other "+nonce,primaryDomain:"inother-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:own.relationship.id,title:"Inline "+nonce,
    description:"Fixture",employmentType:"FULL_TIME",workMode:"REMOTE",applicationMode:"INTERNAL"});
  const round=await createPlacementRound(tpo,job.id,{kind:"TEST",name:"Screen"});
  await publishPlacementJob(tpo,job.id);
  const id=randomUUID();
  const hr=(companyId:string,relationshipId:string,collegeId:string):RequestContext=>({
   user:{id,identityUid:"inline-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:id,companyId,companyName:"Fixture",title:null,status:"ACTIVE",
    grants:[{id:randomUUID(),collegeId,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:relationshipId}]}});
  const record=await getHrJobRead(hr(own.company.id,own.relationship.id,SEED_IDS.collegeA),job.id,{tab:"rounds",roundId:round.id});
  expect(projectRecruiterRoundResults(record.workspace.rounds,round.id,"ALL")?.counts.all).toBe(0);
  await expect(getHrJobRead(hr(other.company.id,other.relationship.id,SEED_IDS.collegeA),job.id,{tab:"rounds"}))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getHrJobRead(hr(own.company.id,own.relationship.id,SEED_IDS.collegeB),job.id,{tab:"rounds"}))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getHrJobRead(tpo,job.id,{tab:"rounds"})).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
 });
});
