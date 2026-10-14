import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {listRecruiterJobActivity} from "@/modules/placements/hr-job-activity-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-feed-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR job activity PG scopes",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("reads own job publication but denies foreign employer and wrong role",async()=>{
  const n=randomUUID().slice(0,8);
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Feed Own "+n,primaryDomain:"fown-"+n+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Feed Other "+n,primaryDomain:"fother-"+n+".example"});
  const make=async(rel:string,title:string)=>{
   const j=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:rel,
    title,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
   await publishPlacementJob(tpo,j.id);return j;
  };
  const own=await make(a.relationship.id,"HR Feed Own "+n);
  const other=await make(b.relationship.id,"HR Feed Other "+n);
  const uid=randomUUID();
  const hr=(companyId:string,rel:string):RequestContext=>({
   user:{id:uid,identityUid:"hr-feed-"+n,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:uid,companyId,companyName:"Fixture",title:null,status:"ACTIVE",
    grants:[{id:randomUUID(),collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
     collegeName:"Fixture",companyRelationshipId:rel}]}});
  const result=await listRecruiterJobActivity(hr(a.company.id,a.relationship.id),{collegeId:SEED_IDS.collegeA});
  expect(result.status).toBe("READY");
  expect(result.events.some(e=>e.jobId===own.id)).toBe(true);
  expect(result.events.some(e=>e.jobId===other.id)).toBe(false);
  const published=await listRecruiterJobActivity(hr(a.company.id,a.relationship.id),
    {collegeId:SEED_IDS.collegeA,kind:"PUBLISHED"});
  expect(published.events.every(e=>e.status==="Published")).toBe(true);
  await expect(listRecruiterJobActivity(tpo,{})).rejects.toBeDefined();
  await expect(listRecruiterJobActivity(hr(b.company.id,b.relationship.id),
   {collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
 });
});
