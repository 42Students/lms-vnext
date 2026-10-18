import {z} from "zod";
import type {TpoNotificationPreferences} from "./tpo-my-notifications-model";

/** Personal TPO notification preferences: no caller-supplied user/college IDs. */
export const tpoNotificationPreferenceSaveSchema=z.strictObject({
 morningDigest:z.boolean(),
 recruiterMessages:z.boolean(),
 requests:z.boolean(),
 resultsReady:z.boolean(),
 followUps:z.boolean(),
 expectedVersion:z.iso.datetime({offset:true}).nullable(),
});

export function tpoNotificationPreferenceValues(input:z.infer<typeof tpoNotificationPreferenceSaveSchema>):TpoNotificationPreferences{
 return {
  morningDigest:input.morningDigest,
  recruiterMessages:input.recruiterMessages,
  requests:input.requests,
  resultsReady:input.resultsReady,
  followUps:input.followUps,
 };
}

/** Compare every persisted switch under the college write lock before CAS:
 * a completed request may be retried with an obsolete expectedVersion. */
export function tpoNotificationPreferencesMatch(current:TpoNotificationPreferences,desired:TpoNotificationPreferences):boolean{
 return current.morningDigest===desired.morningDigest &&
  current.recruiterMessages===desired.recruiterMessages &&
  current.requests===desired.requests &&
  current.resultsReady===desired.resultsReady &&
  current.followUps===desired.followUps;
}
