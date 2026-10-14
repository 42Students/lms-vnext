import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {getRecruiterCompanyReports} from "@/modules/placements/recruiter-company-reports-service";
import {buildRecruiterCompanyReportRows} from "@/modules/placements/recruiter-company-reports-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-report-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR report result privacy",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("never returns report data for wrong role or a recruiter without company grants",async()=>{
  const nonce=randomUUID().slice(0,8);
  await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Reports "+nonce,primaryDomain:"hrrep-"+nonce+".example"});
  const noGrant:RequestContext={user:{id:randomUUID(),identityUid:"no-grant-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},
   membership:null,recruiter:{userId:randomUUID(),companyId:randomUUID(),companyName:"Fixture",status:"ACTIVE",title:null,grants:[]}};
  expect((await getRecruiterCompanyReports(noGrant,{})).status).toBe("NO_ACCESS");
  await expect(getRecruiterCompanyReports(tpo,{})).rejects.toBeDefined();
  expect(buildRecruiterCompanyReportRows([],[])).toEqual([]);
 });
});
