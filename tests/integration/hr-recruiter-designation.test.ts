import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {eq} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {users} from "@/db/schema";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {grantPlacementRecruiter} from "@/modules/placements/recruiter-service";
import {updateOwnRecruiterDesignation} from "@/modules/placements/recruiter-designation-service";
import {getRecruiterSelfProfile} from "@/modules/placements/recruiter-profile-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-title-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR designation optimistic PG write",()=>{
 afterAll(async()=>{await closeDatabaseConnection();}); // Append-only activity references fixtures.
 it("writes own title with audit while denying stale, foreign-company and wrong role",async()=>{
  const nonce=randomUUID().slice(0,8),email="hr-"+nonce+"@example.test";
  const [recruiterUser]=await getDb().insert(users).values({identityUid:"hr-title-"+nonce,email,displayName:"HR User"}).returning();
  const company=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"HR Title "+nonce,primaryDomain:"hr-title-"+nonce+".example"});
  const grant=await grantPlacementRecruiter(tpo,{companyRelationshipId:company.relationship.id,email,title:"Associate"});
  const ctx:RequestContext={user:{id:recruiterUser.id,identityUid:recruiterUser.identityUid,platformStatus:"ACTIVE",systemRoles:[]},
   membership:null,recruiter:{userId:recruiterUser.id,companyId:company.company.id,companyName:company.company.name,title:"Associate",
    status:"ACTIVE",grants:[{id:grant.grant.id,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:company.relationship.id}]}};
  const old=(await getRecruiterSelfProfile(ctx)).profileUpdatedAt.toISOString();
  const written=await updateOwnRecruiterDesignation(ctx,{title:"Senior Recruiter",expectedUpdatedAt:old});
  expect(written.title).toBe("Senior Recruiter");
  await expect(updateOwnRecruiterDesignation(ctx,{title:"Stale",expectedUpdatedAt:old}))
   .rejects.toMatchObject({code:"PLACEMENT_RECRUITER_PROFILE_STALE"});
  await expect(updateOwnRecruiterDesignation(tpo,{title:"Unauthorized",expectedUpdatedAt:written.updatedAt}))
   .rejects.toBeDefined();
  const wrongCompany={...ctx,recruiter:{...ctx.recruiter!,companyId:randomUUID()}};
  await expect(updateOwnRecruiterDesignation(wrongCompany,{title:"Foreign",expectedUpdatedAt:written.updatedAt}))
   .rejects.toBeDefined();
  expect((await getDb().select({title:users.displayName}).from(users).where(eq(users.id,ctx.user.id)))[0]?.title).toBe("HR User");
 });
});
