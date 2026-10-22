import { publishableJobTerms } from "../support/publishable-job-terms";
import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {and,eq} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {users,activityEvents,inAppNotifications,placementJobs,placementRecruiterCollegeGrants} from "@/db/schema";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob} from "@/modules/placements/job-service";
import {publishPreparedPlacementJob} from "../support/publishable-job-fixture";
import {grantPlacementRecruiter} from "@/modules/placements/recruiter-service";
import {markHrNotificationRead} from "@/modules/placements/hr-notification-read-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-ack-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR notification acknowledgement PG",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("marks only own exact-company notification, denies foreign and stale token",async()=>{
  const nonce=randomUUID().slice(0,8),email="hr-ack-"+nonce+"@example.test";
  const [person]=await getDb().insert(users).values({identityUid:"hr-ack-"+nonce,email,displayName:"Recruiter"}).returning();
  const own=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Ack Own "+nonce,primaryDomain:"ackown-"+nonce+".example"});
  const foreign=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Ack Foreign "+nonce,primaryDomain:"ackforeign-"+nonce+".example"});
  const grant=await grantPlacementRecruiter(tpo,{companyRelationshipId:own.relationship.id,email,title:"HR"});
  // A fresh grant defaults to PENDING. Test visibility only after persisted
  // verification, never by weakening the recruiter authorization predicate.
  await getDb().update(placementRecruiterCollegeGrants)
   .set({verificationStatus:"VERIFIED",capabilities:["DRIVES"],
    validUntil:new Date("2099-01-01T00:00:00.000Z")})
   .where(eq(placementRecruiterCollegeGrants.id,grant.grant.id));
  async function publish(relationshipId:string){
   const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:relationshipId,
    title:"Ack Job "+randomUUID(),description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL",...publishableJobTerms});
   await publishPreparedPlacementJob(tpo,job.id);
   // Notifications require a genuinely owned drive; employer-company grants
   // alone must not reveal another author\u0027s drive to a recruiter.
   if(relationshipId===own.relationship.id){
    await getDb().update(placementJobs).set({createdByUserId:person.id})
     .where(eq(placementJobs.id,job.id));
   }
   const [event]=await getDb().select({id:activityEvents.id}).from(activityEvents)
    .where(and(eq(activityEvents.subjectId,job.id),eq(activityEvents.eventType,"placements.job.published"))).limit(1);
   const [notice]=await getDb().insert(inAppNotifications).values({
    userId:person.id,eventId:event!.id,title:"Private",body:"Do not render",
   }).returning();
   return notice;
  }
  const one=await publish(own.relationship.id),two=await publish(foreign.relationship.id);
  const ctx:RequestContext={user:{id:person.id,identityUid:person.identityUid,platformStatus:"ACTIVE",systemRoles:[]},
   membership:null,recruiter:{userId:person.id,companyId:own.company.id,companyName:"Fixture",status:"ACTIVE",
    title:null,grants:[{id:grant.grant.id,collegeId:SEED_IDS.collegeA,
     organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:own.relationship.id}]}};
  await expect(markHrNotificationRead(ctx,two.id,{expectedCreatedAt:two.createdAt.toISOString()}))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  const result=await markHrNotificationRead(ctx,one.id,{expectedCreatedAt:one.createdAt.toISOString()});
  expect(result.readAt).toBeTruthy();
  // A lost network response must be retry-safe without writing a second mark.
  const retry=await markHrNotificationRead(ctx,one.id,{expectedCreatedAt:one.createdAt.toISOString()});
  expect(retry).toEqual(result);
  const [persisted]=await getDb().select({readAt:inAppNotifications.readAt})
   .from(inAppNotifications).where(eq(inAppNotifications.id,one.id)).limit(1);
  expect(persisted?.readAt?.toISOString()).toBe(result.readAt);
  await expect(markHrNotificationRead(ctx,one.id,{expectedCreatedAt:
   new Date(one.createdAt.getTime()+1).toISOString()}))
   .rejects.toMatchObject({code:"PLACEMENT_RECRUITER_NOTIFICATION_STALE"});
  await expect(markHrNotificationRead(tpo,one.id,{expectedCreatedAt:one.createdAt.toISOString()}))
   .rejects.toBeDefined();
 });
});
