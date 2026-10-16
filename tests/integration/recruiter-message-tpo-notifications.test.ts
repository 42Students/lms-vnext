import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {and,eq} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {activityEvents,inAppNotifications,membershipRoles} from "@/db/schema";
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
  const messageId=randomUUID(),threadId=randomUUID();
  const receipt=await getDb().transaction(async tx=>notifyTpoOfRecruiterMessage(tx,{
   collegeId:SEED_IDS.collegeA,threadId,messageId,
   senderUserId:SEED_IDS.learnerUser,at:new Date(),
  }));
  expect(receipt.notified).toBeGreaterThan(0);
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
   actionHref:"/tpo/messages/notifications",
  });
  expect(notifications.some(item=>item.userId===SEED_IDS.learnerUser)).toBe(false);
 });
});
