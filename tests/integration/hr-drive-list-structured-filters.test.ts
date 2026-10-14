import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {filterRecruiterDrives,recruiterDriveListQuerySchema} from "@/modules/placements/recruiter-drive-list-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-filters-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR drive structured filter PG",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("filters a new own-company job but excludes other company/college and wrong role",async()=>{
  const nonce=randomUUID().slice(0,8);
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Filter A "+nonce,primaryDomain:"hrfa-"+nonce+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Filter B "+nonce,primaryDomain:"hrfb-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:a.relationship.id,
   title:"Remote Engineer "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"REMOTE",applicationMode:"INTERNAL"});
  await publishPlacementJob(tpo,job.id);
  const uid=randomUUID();
  const hr=(companyId:string,rel:string,collegeId:string):RequestContext=>({
   user:{id:uid,identityUid:"hr-filter-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:uid,companyId,companyName:"Fixture",title:null,status:"ACTIVE",
    grants:[{id:randomUUID(),collegeId,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:rel}]}});
  const query=recruiterDriveListQuerySchema.parse({mode:"REMOTE",employment:"FULL_TIME",q:nonce});
  const own=filterRecruiterDrives(await listOwnRecruiterPlacementJobs(hr(a.company.id,a.relationship.id,SEED_IDS.collegeA)),query);
  expect(own.some(row=>row.job.id===job.id)).toBe(true);
  const foreign=filterRecruiterDrives(await listOwnRecruiterPlacementJobs(hr(b.company.id,b.relationship.id,SEED_IDS.collegeA)),query);
  expect(foreign.some(row=>row.job.id===job.id)).toBe(false);
  const otherCollege=filterRecruiterDrives(await listOwnRecruiterPlacementJobs(hr(a.company.id,a.relationship.id,SEED_IDS.collegeB)),query);
  expect(otherCollege.some(row=>row.job.id===job.id)).toBe(false);
  await expect(listOwnRecruiterPlacementJobs(tpo)).rejects.toBeDefined();
 });
});
