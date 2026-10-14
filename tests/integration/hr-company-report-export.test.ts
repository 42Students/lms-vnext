import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {getRecruiterCompanyReports} from "@/modules/placements/recruiter-company-reports-service";
import {buildHrCompanyReportCsv} from "@/modules/placements/hr-company-report-export-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-report-csv-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR company report export PostgreSQL",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("exports own company's drives but not another company's in the same college",async()=>{
  const n=randomUUID().slice(0,8);
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Rep Own "+n,primaryDomain:"repown-"+n+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Rep Other "+n,primaryDomain:"repother-"+n+".example"});
  const make=async(relationshipId:string)=>{
   const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:relationshipId,
    title:"Report job "+randomUUID(),description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
   await publishPlacementJob(tpo,job.id);return job;
  };
  const own=await make(a.relationship.id),other=await make(b.relationship.id);
  const uid=randomUUID();
  const hr:RequestContext={user:{id:uid,identityUid:"hr-report-"+n,platformStatus:"ACTIVE",systemRoles:[]},
   membership:null,recruiter:{userId:uid,companyId:a.company.id,companyName:"Own",title:null,status:"ACTIVE",
    grants:[{id:randomUUID(),collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
     collegeName:"Fixture",companyRelationshipId:a.relationship.id}]}};
  const report=await getRecruiterCompanyReports(hr,{collegeId:SEED_IDS.collegeA,pageSize:50});
  expect(report.status).toBe("READY");
  if(report.status==="READY"){
   expect(report.jobs.some(x=>x.id===own.id)).toBe(true);
   expect(report.jobs.some(x=>x.id===other.id)).toBe(false);
   expect(buildHrCompanyReportCsv(report.jobs,report.matchedTotal).exported).toBeGreaterThanOrEqual(1);
  }
  await expect(getRecruiterCompanyReports(tpo,{})).rejects.toBeDefined();
 });
});
