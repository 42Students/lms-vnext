import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob, publishPlacementJob } from "@/modules/placements/job-service";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { filterRecruiterDrives, recruiterDriveListQuerySchema } from "@/modules/placements/recruiter-drive-list-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const tpo: RequestContext = {user: {id: SEED_IDS.facultyUser, identityUid:"hr-list-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR drive list scope (isolated PG)", () => {
 afterAll(async () => {await closeDatabaseConnection();}); // Append-only audit references: retain created fixtures.
 it("lists own published job but hides another company and refuses wrong role", async () => {
   const nonce=randomUUID().slice(0,8);
   const own=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Drive Own "+nonce,primaryDomain:"own-"+nonce+".example"});
   const another=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Drive Foreign "+nonce,primaryDomain:"other-"+nonce+".example"});
   const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:own.relationship.id,
     title:"Recruiter Job "+nonce,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
   await publishPlacementJob(tpo,job.id);
   const userId=randomUUID();
   const context=(companyId:string,relationshipId:string,collegeId:string):RequestContext=>({
     user:{id:userId,identityUid:"hr-drive-"+nonce,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
     recruiter:{userId,companyId,companyName:"Test",title:null,status:"ACTIVE",grants:[{
      id:randomUUID(),collegeId,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:relationshipId}]}});
   const rows=await listOwnRecruiterPlacementJobs(context(own.company.id,own.relationship.id,SEED_IDS.collegeA));
   expect(filterRecruiterDrives(rows,recruiterDriveListQuerySchema.parse({collegeId:SEED_IDS.collegeA}))
      .some(row=>row.job.id===job.id)).toBe(true);
   const foreign=await listOwnRecruiterPlacementJobs(context(another.company.id,another.relationship.id,SEED_IDS.collegeA));
   expect(foreign.some(row=>row.job.id===job.id)).toBe(false);
   const foreignCollege=await listOwnRecruiterPlacementJobs(context(own.company.id,own.relationship.id,SEED_IDS.collegeB));
   expect(foreignCollege.some(row=>row.job.id===job.id)).toBe(false);
   await expect(listOwnRecruiterPlacementJobs(tpo)).rejects.toBeDefined();
 });
});
