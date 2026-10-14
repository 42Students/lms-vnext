import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {createPlacementRound,actOnPlacementRound} from "@/modules/placements/round-service";
import {getRecruiterPlacementWorkspace} from "@/modules/placements/recruiter-workspace-service";
import {hrScheduledRoundRows} from "@/modules/placements/hr-round-schedule-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-schedule-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR round schedule scoped PG",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("shows own scheduled round, denies foreign company and wrong role",async()=>{
  const n=randomUUID().slice(0,8);
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Sched Own "+n,primaryDomain:"schedown-"+n+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Sched Other "+n,primaryDomain:"schedother-"+n+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:a.relationship.id,
   title:"Schedule "+n,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
  const round=await createPlacementRound(tpo,job.id,{kind:"INTERVIEW",name:"Panel",durationMinutes:60});
  await actOnPlacementRound(tpo,round.id,{action:"SCHEDULE",scheduledAt:new Date("2026-10-20T10:00:00Z"),
   timezone:"Asia/Kolkata",mode:"VIRTUAL",meetingUrl:"https://example.test/meet"});
  await publishPlacementJob(tpo,job.id);
  const uid=randomUUID();
  const hr=(companyId:string,rel:string):RequestContext=>({
   user:{id:uid,identityUid:"hr-schedule-"+n,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:uid,companyId,companyName:"Fixture",status:"ACTIVE",title:null,
    grants:[{id:randomUUID(),collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
     collegeName:"Fixture",companyRelationshipId:rel}]}});
  const own=await getRecruiterPlacementWorkspace(hr(a.company.id,a.relationship.id),job.id);
  expect(hrScheduledRoundRows(own.rounds).some(x=>x.id===round.id)).toBe(true);
  await expect(getRecruiterPlacementWorkspace(hr(b.company.id,b.relationship.id),job.id))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getRecruiterPlacementWorkspace(tpo,job.id)).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
 });
});
