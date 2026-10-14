import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {createPlacementRound,actOnPlacementRound} from "@/modules/placements/round-service";
import {listRecruiterCalendarEvents} from "@/modules/placements/recruiter-calendar-service";
import {combineHrCalendarDays,selectHrMobileCalendarDays} from "@/modules/placements/hr-calendar-day-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-due-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR results due calendar PostgreSQL",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Keep audit-referenced fixtures.
 it("shows own scheduled round due but not foreign-company/foreign-college due",async()=>{
  const nonce=randomUUID().slice(0,8);
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Due A "+nonce,primaryDomain:"duea-"+nonce+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Due B "+nonce,primaryDomain:"dueb-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:a.relationship.id,
   title:"Due Job "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
  const round=await createPlacementRound(tpo,job.id,{kind:"INTERVIEW",name:"Final"});
  await actOnPlacementRound(tpo,round.id,{action:"SCHEDULE",scheduledAt:new Date("2026-10-20T08:00:00Z"),
   resultsDueAt:new Date("2026-10-22T08:00:00Z"),timezone:"Asia/Kolkata",mode:"VIRTUAL",meetingUrl:"https://example.test/meet"});
  await publishPlacementJob(tpo,job.id);
  const uid=randomUUID();
  const hr=(companyId:string,rel:string,collegeId:string):RequestContext=>({
    user:{id:uid,identityUid:"hr-due-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
    recruiter:{userId:uid,companyId,companyName:"Fixture",title:null,status:"ACTIVE",
     grants:[{id:randomUUID(),collegeId,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:rel}]}});
  const query={from:"2026-10-21",to:"2026-10-23"};
  const own=await listRecruiterCalendarEvents(hr(a.company.id,a.relationship.id,SEED_IDS.collegeA),query);
  expect(own.resultsDue.some(item=>item.id===round.id)).toBe(true);
  expect(combineHrCalendarDays(own.days, own.resultsDue).some(day=>day.resultsDue.some(item=>item.id===round.id))).toBe(true);
  expect(selectHrMobileCalendarDays(combineHrCalendarDays(own.days, own.resultsDue),
    ["2026-10-22"]).some(day=>day.resultsDue.some(item=>item.id===round.id))).toBe(true);
  const foreign=await listRecruiterCalendarEvents(hr(b.company.id,b.relationship.id,SEED_IDS.collegeA),query);
  expect(foreign.resultsDue.some(item=>item.id===round.id)).toBe(false);
  const otherCollege=await listRecruiterCalendarEvents(hr(a.company.id,a.relationship.id,SEED_IDS.collegeB),query);
  expect(otherCollege.resultsDue.some(item=>item.id===round.id)).toBe(false);
  await expect(listRecruiterCalendarEvents(tpo,query)).rejects.toBeDefined();
 });
});
