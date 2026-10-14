import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
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
   title:"OfferCsv "+n,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
  await publishPlacementJob(tpo,job.id);
  const uid=randomUUID();
  const hr=(companyId:string,rel:string):RequestContext=>({
   user:{id:uid,identityUid:"hr-oc-"+n,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:uid,companyId,companyName:"Fixture",status:"ACTIVE",title:null,
    grants:[{id:randomUUID(),collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
     collegeName:"Fixture",companyRelationshipId:rel}]}});
  const own=await getHrJobRead(hr(a.company.id,a.relationship.id),job.id,{tab:"offers"});
  expect(buildHrOfferCsv(own.offers,own.offersPage.total).exported).toBe(0);
  await expect(getHrJobRead(hr(b.company.id,b.relationship.id),job.id,{tab:"offers"}))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getHrJobRead(tpo,job.id,{tab:"offers"})).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
 });
});
