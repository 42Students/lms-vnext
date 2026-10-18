import {describe,expect,it} from "vitest";
import {
 tpoNotificationPreferenceSaveSchema,tpoNotificationPreferenceValues,tpoNotificationPreferencesMatch,
} from "@/modules/placements/tpo-my-notification-preferences-model";
import {
 resolveTpoNotificationPreferences,TPO_NOTIFICATION_PREFERENCE_DEFAULTS,
 TPO_NOTIFICATION_PREFERENCE_FIELDS,
} from "@/modules/placements/tpo-my-notifications-model";
const fields=["morningDigest","recruiterMessages","requests","resultsReady","followUps"] as const;
const input={...TPO_NOTIFICATION_PREFERENCE_DEFAULTS,expectedVersion:null};

describe("TPO-settings-audit-PREF-02 personal notification preferences adversarial matrix",()=>{
 it("exposes all and only the five established preference switches",()=>{
  expect(TPO_NOTIFICATION_PREFERENCE_FIELDS.map(field=>field.key)).toEqual(fields);
  expect(new Set(TPO_NOTIFICATION_PREFERENCE_FIELDS.map(field=>field.key)).size).toBe(5);
 });
 it("distinguishes migration-unavailable, sourced defaults and saved values",()=>{
  expect(resolveTpoNotificationPreferences(false,null))
   .toEqual({source:"UNAVAILABLE",values:null});
  const defaults=resolveTpoNotificationPreferences(true,null);
  expect(defaults).toEqual({source:"SOURCE_DEFAULT",values:TPO_NOTIFICATION_PREFERENCE_DEFAULTS});
  expect(defaults.values).not.toBe(TPO_NOTIFICATION_PREFERENCE_DEFAULTS);
  const saved=resolveTpoNotificationPreferences(true,{...TPO_NOTIFICATION_PREFERENCE_DEFAULTS,morningDigest:true});
  expect(saved.source).toBe("PERSISTED");
  expect(saved.values?.morningDigest).toBe(true);
 });
 it("rejects caller-selected user, membership, college, organization and unknown switches",()=>{
  expect(tpoNotificationPreferenceSaveSchema.safeParse(input).success).toBe(true);
  for(const bad of [
   {...input,userId:"attacker"},
   {...input,collegeId:"another-college"},
   {...input,organizationId:"another-org"},
   {...input,membershipId:"another-membership"},
   {...input,enabled:true},{...input,bulkSms:true},
   {...input,expectedVersion:"yesterday"},
   {...input,expectedVersion:123},
   {...input,morningDigest:"true"},
  ])expect(tpoNotificationPreferenceSaveSchema.safeParse(bad).success).toBe(false);
 });
 it("compares all five persisted fields, refusing no-op equality when one switch differs",()=>{
  const desired=tpoNotificationPreferenceValues(input);
  expect(tpoNotificationPreferencesMatch(desired,{...desired})).toBe(true);
  for(const field of fields){
   const toggled={...desired,[field]:!desired[field]};
   expect(tpoNotificationPreferencesMatch(desired,toggled)).toBe(false);
  }
  expect(desired).toEqual(TPO_NOTIFICATION_PREFERENCE_DEFAULTS);
 });
 it("requires an offset-qualified optimistic version when supplied",()=>{
  const valid={...input,expectedVersion:"2099-05-21T01:30:00.000+05:30"};
  expect(tpoNotificationPreferenceSaveSchema.safeParse(valid).success).toBe(true);
  for(const version of ["2099-05-21T01:30:00","2099-05-21","2099-13-01T01:00:00Z",""]){
   expect(tpoNotificationPreferenceSaveSchema.safeParse({...input,expectedVersion:version}).success).toBe(false);
  }
 });
});
