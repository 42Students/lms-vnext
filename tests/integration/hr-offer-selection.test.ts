import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {getHrJobRead} from "@/modules/placements/hr-job-read-service";
import {buildHrOfferOverview} from "@/modules/placements/hr-offer-selection-read-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-offer-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR offer read scope PG",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Never remove audit referenced fixtures.
 it("reads only same company/college offers without claiming unbacked LOI",async()=>{
  const nonce=randomUUID().slice(0,8);
  const own=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Offer HR Own "+nonce,primaryDomain:"offer-"+nonce+".example"});
  const other=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Offer HR Other "+nonce,primaryDomain:"other-offer-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:own.relationship.id,title:"Offer HR "+nonce,
    description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
  await publishPlacementJob(tpo,job.id);
  const uid=randomUUID();
  const hr=(companyId:string,rel:string,collegeId:string):RequestContext=>({
    user:{id:uid,identityUid:"hr-offer-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
    recruiter:{userId:uid,companyId,companyName:"Fixture",title:null,status:"ACTIVE",
      grants:[{id:randomUUID(),collegeId,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:rel}]}});
  const ownRead=await getHrJobRead(hr(own.company.id,own.relationship.id,SEED_IDS.collegeA),job.id,{tab:"offers"});
  expect(buildHrOfferOverview(ownRead.offers,new Date()).recorded).toBe(0);
  await expect(getHrJobRead(hr(other.company.id,other.relationship.id,SEED_IDS.collegeA),job.id,{tab:"offers"}))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getHrJobRead(hr(own.company.id,own.relationship.id,SEED_IDS.collegeB),job.id,{tab:"offers"}))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getHrJobRead(tpo,job.id,{tab:"offers"})).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
 });
});
