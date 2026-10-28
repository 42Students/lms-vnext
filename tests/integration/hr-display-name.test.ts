import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {eq} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {users,activityEvents} from "@/db/schema";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {grantPlacementRecruiter} from "@/modules/placements/recruiter-service";
import {getRecruiterSelfProfile} from "@/modules/placements/recruiter-profile-service";
import {updateOwnHrDisplayName} from "@/modules/placements/hr-display-name-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-name-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR own name optimistic PG",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("updates only self with audit; denies stale, foreign-company and wrong role",async()=>{
  const n=randomUUID().slice(0,8),email="hr-name-"+n+"@example.test";
  const [user]=await getDb().insert(users).values({identityUid:"hr-name-"+n,email,displayName:"Old Recruiter",givenName:"Old",familyName:"Recruiter"}).returning();
  const company=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,
   name:"HR Name "+n,primaryDomain:"hr-name-"+n+".example"});
  const grant=await grantPlacementRecruiter(tpo,{companyRelationshipId:company.relationship.id,email,title:"Associate"});
  const ctx:RequestContext={user:{id:user.id,identityUid:user.identityUid,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
   recruiter:{userId:user.id,companyId:company.company.id,companyName:company.company.name,
    title:"Associate",status:"ACTIVE",grants:[{id:grant.grant.id,collegeId:SEED_IDS.collegeA,
     organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:company.relationship.id}]}};
  const old=(await getRecruiterSelfProfile(ctx)).userUpdatedAt.toISOString();
  const updated=await updateOwnHrDisplayName(ctx,{displayName:"New Recruiter",expectedUpdatedAt:old});
  expect(updated).toMatchObject({displayName:"New Recruiter",changed:true});
  await expect(updateOwnHrDisplayName(ctx,{displayName:"Stale",expectedUpdatedAt:old}))
   .rejects.toMatchObject({code:"PLACEMENT_RECRUITER_PROFILE_STALE"});
  await expect(updateOwnHrDisplayName({...ctx,recruiter:{...ctx.recruiter!,companyId:randomUUID()}},
   {displayName:"Foreign",expectedUpdatedAt:updated.updatedAt})).rejects.toBeDefined();
  await expect(updateOwnHrDisplayName(tpo,{displayName:"Wrong role",expectedUpdatedAt:updated.updatedAt}))
   .rejects.toBeDefined();
  const [persisted]=await getDb().select({name:users.displayName,
   givenName:users.givenName,familyName:users.familyName,
   version:users.identityProfileVersion}).from(users).where(eq(users.id,user.id));
  expect(persisted).toMatchObject({name:"New Recruiter",givenName:null,familyName:null,version:2});
  const audit=await getDb().select({summary:activityEvents.summary}).from(activityEvents)
   .where(eq(activityEvents.actorUserId,user.id));
  expect(audit.some(row=>row.summary==="Recruiter display name updated")).toBe(true);
 });
});
