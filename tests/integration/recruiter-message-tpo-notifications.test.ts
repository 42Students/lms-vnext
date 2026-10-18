import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {and,eq} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {activityEvents,inAppNotifications,membershipRoles,placementCompanies,placementCompanyRelationships,placementRecruiterCollegeGrants,
 placementRecruiterProfiles,placementTpoMessages,placementTpoMessageThreads,users} from "@/db/schema";
import {notifyTpoOfRecruiterMessage} from "@/modules/placements/recruiter-message-tpo-notification-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
describe.skipIf(!enabled)("REC-calendar-messages-profile-17 recipient isolation on PostgreSQL",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("creates a transactional TPO bell for a real active same-college member",async()=>{
  await getDb().insert(membershipRoles).values({
   membershipId:SEED_IDS.facultyCollegeAMembership,role:"TPO",
  }).onConflictDoNothing();
  // The notifier reads the persisted recruiter message, so create a real
  // recruiter, company, college grant, thread and message first. Message
  // history is append-only (DB triggers), so this fixture stays in the
  // disposable database like the TPO role row above.
  const nonce=randomUUID();
  const [recruiter]=await getDb().insert(users).values({
   identityUid:"rec-msg-bell-"+nonce,displayName:"Bell Recruiter",
  }).returning({id:users.id});
  const [company]=await getDb().insert(placementCompanies).values({
   name:"Bell Recruiter Co "+nonce,createdByUserId:SEED_IDS.facultyUser,
  }).returning({id:placementCompanies.id});
  await getDb().insert(placementRecruiterProfiles).values({
   userId:recruiter!.id,companyId:company!.id,createdByUserId:SEED_IDS.facultyUser,
  });
  const sentAt=new Date();
  const [relationship]=await getDb().insert(placementCompanyRelationships).values({
   collegeId:SEED_IDS.collegeA,companyId:company!.id,createdByUserId:SEED_IDS.facultyUser,
  }).returning({id:placementCompanyRelationships.id});
  await getDb().insert(placementRecruiterCollegeGrants).values({
   recruiterUserId:recruiter!.id,companyRelationshipId:relationship!.id,
   grantedByUserId:SEED_IDS.facultyUser,
  });
  // The thread's last_message_at projection is checked at commit, so the
  // thread, message and projection are written in one transaction.
  const {threadId,messageId}=await getDb().transaction(async tx=>{
   const [thread]=await tx.insert(placementTpoMessageThreads).values({
    collegeId:SEED_IDS.collegeA,recruiterUserId:recruiter!.id,
   }).returning({id:placementTpoMessageThreads.id});
   const [message]=await tx.insert(placementTpoMessages).values({
    threadId:thread!.id,senderType:"RECRUITER",senderUserId:recruiter!.id,
    body:"Hello from the recruiter",createdAt:sentAt,
   }).returning({id:placementTpoMessages.id});
   await tx.update(placementTpoMessageThreads).set({lastMessageAt:sentAt})
    .where(eq(placementTpoMessageThreads.id,thread!.id));
   return {threadId:thread!.id,messageId:message!.id};
  });
  const receipt=await getDb().transaction(async tx=>notifyTpoOfRecruiterMessage(tx,{
   collegeId:SEED_IDS.collegeA,threadId,messageId,
   senderUserId:recruiter!.id,at:new Date(),
  }));
  expect(receipt.notified).toBeGreaterThan(0);
  // A duplicate webhook, worker retry or stale tab cannot create a second
  // activity event (or second recipient bell) for the same persisted message.
  const replay=await getDb().transaction(async tx=>notifyTpoOfRecruiterMessage(tx,{
   collegeId:SEED_IDS.collegeA,threadId,messageId,
   senderUserId:recruiter!.id,at:new Date(),
  }));
  expect(replay).toEqual({notified:0});
  const counted=await getDb().select({id:activityEvents.id})
   .from(activityEvents).where(and(
    eq(activityEvents.eventType,"placements.recruiter.message.received"),
    eq(activityEvents.dedupeKey,"placements.recruiter.message.received:"+messageId),
   ));
  expect(counted).toHaveLength(1);
  const [event]=await getDb().select({id:activityEvents.id})
   .from(activityEvents).where(and(
    eq(activityEvents.subjectId,threadId),
    eq(activityEvents.eventType,"placements.recruiter.message.received"),
   )).limit(1);
  expect(event).toBeDefined();
  const notifications=await getDb().select({userId:inAppNotifications.userId,
   title:inAppNotifications.title,actionHref:inAppNotifications.actionHref})
   .from(inAppNotifications).where(eq(inAppNotifications.eventId,event!.id));
  expect(notifications).toContainEqual({
   userId:SEED_IDS.facultyUser,title:"New message from a recruiter",
   actionHref:"/tpo/messages/"+threadId,
  });
  expect(notifications.some(item=>item.userId===SEED_IDS.learnerUser)).toBe(false);
  expect(notifications.some(item=>item.userId===recruiter!.id)).toBe(false);

 });
});
