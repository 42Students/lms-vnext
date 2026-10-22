import { publishableJobTerms } from "../support/publishable-job-terms";
import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob} from "@/modules/placements/job-service";
import {publishPreparedPlacementJob} from "../support/publishable-job-fixture";
import {createPersistedJobRecruiter,persistedRecruiterContext} from "../support/persisted-job-recruiter-fixture";
import {createPlacementRound} from "@/modules/placements/round-service";
import {getRecruiterPlacementWorkspace} from "@/modules/placements/recruiter-workspace-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-privacy-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR round contact disclosure isolation (isolated PG)",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("authorizes own round, masks foreign company, foreign college and wrong role before any candidates are read",async()=>{
  const nonce=randomUUID().slice(0,8);
  const company=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Private Own "+nonce,primaryDomain:"privown-"+nonce+".example"});
  const foreign=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Private Other "+nonce,primaryDomain:"privforeign-"+nonce+".example"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:company.relationship.id,
    title:"HR Contact "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"REMOTE",applicationMode:"INTERNAL",...publishableJobTerms});
  const round=await createPlacementRound(tpo,job.id,{kind:"INTERVIEW",name:"Panel"});
  await publishPreparedPlacementJob(tpo,job.id);
  const identityUid="hr-contact-"+nonce;
  const recruiter=await createPersistedJobRecruiter({companyId:company.company.id,companyRelationshipId:company.relationship.id,
    collegeId:SEED_IDS.collegeA,jobId:job.id,grantedByUserId:tpo.user.id,identityUid});
  const hr=(companyId:string,relationshipId:string,collegeId:string):RequestContext=>persistedRecruiterContext({
    userId:recruiter.userId,identityUid,companyId,grantId:recruiter.grantId,collegeId,
    organizationId:SEED_IDS.organization,companyRelationshipId:relationshipId});
  const own=await getRecruiterPlacementWorkspace(hr(company.company.id,company.relationship.id,SEED_IDS.collegeA),job.id);
  expect(own.rounds.find(row=>row.id===round.id)?.participants).toEqual([]);
  await expect(getRecruiterPlacementWorkspace(hr(foreign.company.id,foreign.relationship.id,SEED_IDS.collegeA),job.id))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getRecruiterPlacementWorkspace(hr(company.company.id,company.relationship.id,SEED_IDS.collegeB),job.id))
    .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  await expect(getRecruiterPlacementWorkspace(tpo,job.id)).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
 });
});
