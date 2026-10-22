import type {LegacyMailEvent} from "@/modules/notifications/zeptomail-email";

/** Legacy NotificationEventRegistry channel policy, as of 13 October 2026. */
export const LEGACY_NOTIFICATION_CHANNELS: Readonly<Record<LegacyMailEvent, readonly ("IN_APP" | "EMAIL" | "SMS")[]>> = {
  JOB_APPLICATION_CONFIRMATION: ["IN_APP", "SMS"],
  JOB_SHORTLISTED: ["IN_APP", "SMS"],
  JOB_ASSESSMENT_INVITE: ["IN_APP"],
  JOB_INTERVIEW_SCHEDULED: ["IN_APP", "EMAIL", "SMS"],
  JOB_OFFER_EXTENDED: ["IN_APP"],
  JOB_HIRED: ["IN_APP"],
  JOB_APPLICATION_REJECTED: ["IN_APP", "SMS"],
  JOB_WAITLISTED: ["IN_APP"],
  INTERVIEW_REMINDER: ["IN_APP", "EMAIL", "SMS"],
  INTERVIEW_CONFIRMED: ["IN_APP", "EMAIL", "SMS"],
  INTERVIEW_CANCELLED: ["IN_APP"],
  INTERVIEW_RESCHEDULED: ["IN_APP"],
  COURSE_ASSIGNMENT_DUE: ["IN_APP"],
  COURSE_ASSIGNMENT_SUBMITTED: ["IN_APP"],
  COURSE_GRADE_PUBLISHED: ["IN_APP"],
  SYSTEM_EMAIL_VERIFICATION: ["EMAIL"],
  SYSTEM_APPLICATION_APPROVED: ["EMAIL"],
  SYSTEM_APPLICATION_REJECTED: ["EMAIL"],
  SYSTEM_OTP_SMS: ["SMS"],
};


/** Legacy event names from untrusted integrations are not valid merely because
 * a configured generic template exists. Non-allowlisted email events fail
 * closed; the six urgent email events are enumerated above. */
export function legacyChannelIsAllowed(event:unknown,channel:unknown):boolean {
 if(typeof event!=="string"||typeof channel!=="string"||
    (channel!=="IN_APP"&&channel!=="EMAIL"&&channel!=="SMS")||
    !Object.prototype.hasOwnProperty.call(LEGACY_NOTIFICATION_CHANNELS,event))
  return false;
 const allowed=LEGACY_NOTIFICATION_CHANNELS[event as LegacyMailEvent];
 return allowed.includes(channel);
}
