import {describe,expect,it} from "vitest";
import {LEGACY_NOTIFICATION_CHANNELS,legacyChannelIsAllowed} from "@/modules/messaging/legacy-notification-channel-policy";

describe("G2-2-003 legacy event delivery allowlist",()=>{
 it("permits EMAIL for exactly the six approved urgent legacy events",()=>{
  const expected=[
   "JOB_INTERVIEW_SCHEDULED","INTERVIEW_REMINDER","INTERVIEW_CONFIRMED",
   "SYSTEM_EMAIL_VERIFICATION","SYSTEM_APPLICATION_APPROVED",
   "SYSTEM_APPLICATION_REJECTED",
  ];
  const permitted=Object.entries(LEGACY_NOTIFICATION_CHANNELS)
   .filter(([,channels])=>channels.includes("EMAIL"))
   .map(([event])=>event).sort();
  expect(permitted).toEqual(expected.sort());
  expected.forEach(event=>expect(legacyChannelIsAllowed(event,"EMAIL")).toBe(true));
 });
 it("rejects offer, hire, cancel, reschedule and other nonapproved EMAIL events",()=>{
  for(const event of [
   "JOB_APPLICATION_CONFIRMATION","JOB_SHORTLISTED","JOB_ASSESSMENT_INVITE",
   "JOB_OFFER_EXTENDED","JOB_HIRED","JOB_APPLICATION_REJECTED",
   "JOB_WAITLISTED","INTERVIEW_CANCELLED","INTERVIEW_RESCHEDULED",
   "COURSE_ASSIGNMENT_DUE","COURSE_ASSIGNMENT_SUBMITTED","COURSE_GRADE_PUBLISHED",
  ])expect(legacyChannelIsAllowed(event,"EMAIL")).toBe(false);
 });
 it("refuses unregistered event names and unsupported channels",()=>{
  expect(legacyChannelIsAllowed("FUTURE_MAIL_EVENT","EMAIL")).toBe(false);
  expect(legacyChannelIsAllowed("constructor","EMAIL")).toBe(false);
  expect(legacyChannelIsAllowed(null,"EMAIL")).toBe(false);
  expect(legacyChannelIsAllowed("JOB_INTERVIEW_SCHEDULED","WHATSAPP")).toBe(false);
  expect(legacyChannelIsAllowed("JOB_OFFER_EXTENDED","IN_APP")).toBe(true);
 });
});
