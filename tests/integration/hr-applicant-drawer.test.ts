import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {getHrJobRead} from "@/modules/placements/hr-job-read-service";
import {buildHrApplicantDrawer} from "@/modules/placements/hr-applicant-drawer-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-drawer-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR applicant drawer PG guard",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("authorizes own company drive, denies foreign employer and wrong-role before any detail projection",async()=>{
  const nonce=randomUUID().slice(0,8);
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Drawer A "+nonce,primaryDomain:"drawera-"+nonce+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Drawer B "+nonce,primaryDomain:"drawerb-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:a.relationship.id,
    title:"Recruiter Drawer "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
  await publishPlacementJob(tpo,job.id);
  const uid=randomUUID();
  const hr=(companyId:string,rel:string,collegeId:string):RequestContext=>({
    user:{id:uid,identityUid:"hr-drawer-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
    recruiter:{userId:uid,companyId,companyName:"Fixture",status:"ACTIVE",title:null,
     grants:[{id:randomUUID(),collegeId,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:rel}]}
  });
  const own=await getHrJobRead(hr(a.company.id,a.relationship.id,SEED_IDS.collegeA),job.id,{tab:"applicants"});
  expect(own.applicants.rows).toEqual([]);
  expect(own.applicants.counts.all).toBe(0);
  const nextPage = await getHrJobRead(hr(a.company.id,a.relationship.id,SEED_IDS.collegeA),job.id,{tab:"applicants",page:"2"});
  expect(nextPage.applicantsPage.page).toBe(2);
  expect(nextPage.applicants.rows).toEqual([]);
  expect(buildHrApplicantDrawer(own.applicants.rows,randomUUID())).toBeNull();
  await expect(getHrJobRead(hr(b.company.id,b.relationship.id,SEED_IDS.collegeA),job.id,{tab:"applicants"}))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getHrJobRead(hr(a.company.id,a.relationship.id,SEED_IDS.collegeB),job.id,{tab:"applicants"}))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getHrJobRead(tpo,job.id,{tab:"applicants"}))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
 });
});
