import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 tpoNotificationPreferenceSaveSchema,tpoNotificationPreferenceValues,
 tpoNotificationPreferencesMatch,
} from "@/modules/placements/tpo-my-notification-preferences-model";

const token="2026-10-18T18:00:00.000+05:30";
const example={
 morningDigest:false,recruiterMessages:true,requests:true,
 resultsReady:true,followUps:true,expectedVersion:token,
};

describe("TPO-settings-audit-PREF-01 personal notification settings",()=>{
 it("binds every boolean to a strict known field and rejects identity spoofing",()=>{
  const parsed=tpoNotificationPreferenceSaveSchema.parse(example);
  const values=tpoNotificationPreferenceValues(parsed);
  expect(values).toEqual({
   morningDigest:false,recruiterMessages:true,requests:true,
   resultsReady:true,followUps:true,
  });
  expect(values).not.toHaveProperty("expectedVersion");
  for(const bad of [
   {...example,requests:"false"},{...example,expectedVersion:"yesterday"},
   {...example,expectedVersion:1},{...example,followUps:undefined},
   {...example,organizationId:"other-college"},
   {...example,userId:"forged"},{...example,collegeId:"foreign"},
  ])expect(tpoNotificationPreferenceSaveSchema.safeParse(bad).success).toBe(false);
  expect(tpoNotificationPreferenceSaveSchema.safeParse({...example,expectedVersion:null}).success).toBe(true);
 });
 it("requires all five persisted switch values to be equal for an audit-free retry",()=>{
  const values=tpoNotificationPreferenceValues(tpoNotificationPreferenceSaveSchema.parse(example));
  expect(tpoNotificationPreferencesMatch({...values},values)).toBe(true);
  for(const key of Object.keys(values) as (keyof typeof values)[]){
   expect(tpoNotificationPreferencesMatch({...values,[key]:!values[key]},values),key).toBe(false);
  }
 });
 it("rechecks active TPO role under locks before either retry or write; uses monotonic version",()=>{
  const service=readFileSync("src/modules/placements/tpo-my-notification-preferences-write.ts","utf8");
  const lock=service.indexOf('.for("update")');
  const role=service.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  const tpoRole=service.indexOf('hasMembershipRole(persisted,"TPO")');
  const noOp=service.indexOf("tpoNotificationPreferencesMatch(current,values)");
  const cas=service.indexOf("TpoPreferenceSaveError(\"STALE\")");
  const write=service.indexOf(".onConflictDoUpdate");
  const audit=service.indexOf("await tx.insert(activityEvents)");
  expect(lock).toBeGreaterThan(0);
  expect(role).toBeGreaterThan(lock);
  expect(tpoRole).toBeGreaterThan(role);
  expect(noOp).toBeGreaterThan(tpoRole);
  expect(cas).toBeGreaterThan(noOp);
  expect(write).toBeGreaterThan(cas);
  expect(audit).toBeGreaterThan(write);
  expect(service).toContain("placementTpoUserPreferences.userId,userId");
  expect(service).toContain("placementTpoUserPreferences.collegeId,collegeId");
  expect(service).toContain("greatest(clock_timestamp(),date_trunc('milliseconds'");
  expect(service).toContain("return {saved:true,version:saved.updatedAt.toISOString()}");
 });
});
