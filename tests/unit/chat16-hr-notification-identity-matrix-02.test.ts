import {describe,expect,it} from "vitest";
import {
 hrNotificationReadSchema,hrNotificationVersionMatches,ownsHrNotificationActor,
} from "@/modules/placements/hr-notification-read-model";
import {summarizeRecruiterUnread} from "@/modules/placements/hr-conversation-unread-model";
import {safeRecruiterEmailAddressName} from "@/modules/placements/recruiter-message-email-model";

describe("chat-16 recruiter notification identity and presentation",()=>{
 it("HR-NOTIFICATION-IDENTITY-01 requires active signed-in identity to equal recruiter profile",()=>{
  const active={
   user:{id:"user-1",platformStatus:"ACTIVE"},
   recruiter:{userId:"user-1",status:"ACTIVE"},
  };
  expect(ownsHrNotificationActor(active)).toBe(true);
  expect(ownsHrNotificationActor({...active,recruiter:{userId:"user-2",status:"ACTIVE"}}))
   .toBe(false);
  expect(ownsHrNotificationActor({...active,recruiter:{userId:"user-1",status:"DISABLED"}}))
   .toBe(false);
  expect(ownsHrNotificationActor({...active,user:{id:"user-1",platformStatus:"SUSPENDED"}}))
   .toBe(false);
  expect(ownsHrNotificationActor({...active,recruiter:null})).toBe(false);
 });
 it("HR-NOTIFICATION-VERSION-02 rejects expired, incorrect and malformed optimistic tokens",()=>{
  const createdAt=new Date("2099-03-01T12:00:00.000Z");
  expect(hrNotificationVersionMatches(createdAt,createdAt.toISOString())).toBe(true);
  expect(hrNotificationVersionMatches(createdAt,"not a date")).toBe(false);
  expect(hrNotificationVersionMatches(createdAt,"2099-03-01T12:00:00.001Z")).toBe(false);
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:createdAt.toISOString()} ).success).toBe(true);
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:"invalid"}).success).toBe(false);
  expect(hrNotificationReadSchema.safeParse({expectedCreatedAt:createdAt.toISOString(),userId:"other"}).success).toBe(false);
 });
 it("HR-NOTIFICATION-UNREAD-03 keeps corrupted cached unread counts out of the bell",()=>{
  expect(summarizeRecruiterUnread([{unread:4},{unread:-10},{unread:Number.NaN},{unread:3.5}]))
   .toBe(4);
  expect(summarizeRecruiterUnread([])).toBe(0);
  expect(summarizeRecruiterUnread([{unread:Number.MAX_SAFE_INTEGER},{unread:7}]))
   .toBe(Number.MAX_SAFE_INTEGER);
 });
 it("HR-NOTIFICATION-MAIL-NAME-04 strips display-name header control characters",()=>{
  expect(safeRecruiterEmailAddressName("A\r\nB\u202e C")).toBe("A B C");
  expect(safeRecruiterEmailAddressName("  Alice    Example  ")).toBe("Alice Example");
  expect(safeRecruiterEmailAddressName("X".repeat(200))).toHaveLength(160);
 });
});
