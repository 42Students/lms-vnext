import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {createPlacementRound,actOnPlacementRound} from "@/modules/placements/round-service";
import {listRecruiterCalendarEvents} from "@/modules/placements/recruiter-calendar-service";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {projectHrTodayResultsDue} from "@/modules/placements/hr-today-results-due-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-due-today-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR today results due PostgreSQL",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Retain activity referenced fixtures.
 it("reads own result due, not foreign-employer, foreign college or wrong role",async()=>{
  const nonce=randomUUID().slice(0,8);
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Today Due Own "+nonce,primaryDomain:"todayown-"+nonce+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Today Due Foreign "+nonce,primaryDomain:"todayother-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:a.relationship.id,title:"Today "+nonce,
    description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
  const round=await createPlacementRound(tpo,job.id,{kind:"INTERVIEW",name:"Technical"});
  await actOnPlacementRound(tpo,round.id,{action:"SCHEDULE",scheduledAt:new Date("2026-10-18T08:00:00Z"),
    timezone:"Asia/Kolkata",mode:"VIRTUAL",meetingUrl:"https://example.test/meet",resultsDueAt:new Date("2026-10-19T08:00:00Z")});
  await publishPlacementJob(tpo,job.id);
  const uid=randomUUID();
  const hr=(companyId:string,relation:string,collegeId:string):RequestContext=>({
    user:{id:uid,identityUid:"hr-today-due-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
    recruiter:{userId:uid,companyId,companyName:"Fixture",status:"ACTIVE",title:null,
      grants:[{id:randomUUID(),collegeId,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:relation}]}});
  const window={from:"2026-10-18",to:"2026-10-21"};
  const own=hr(a.company.id,a.relationship.id,SEED_IDS.collegeA);
  const calendar=await listRecruiterCalendarEvents(own,window);
  const jobs=await listOwnRecruiterPlacementJobs(own);
  expect(projectHrTodayResultsDue(calendar.resultsDue,jobs.map(x=>x.job.id)).some(x=>x.id===round.id)).toBe(true);
  const other=await listRecruiterCalendarEvents(hr(b.company.id,b.relationship.id,SEED_IDS.collegeA),window);
  expect(other.resultsDue.some(x=>x.id===round.id)).toBe(false);
  const foreignCollege=await listRecruiterCalendarEvents(hr(a.company.id,a.relationship.id,SEED_IDS.collegeB),window);
  expect(foreignCollege.resultsDue.some(x=>x.id===round.id)).toBe(false);
  await expect(listRecruiterCalendarEvents(tpo,window)).rejects.toBeDefined();
 });
});
