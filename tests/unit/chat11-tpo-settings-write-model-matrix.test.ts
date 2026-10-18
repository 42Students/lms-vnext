import {describe,expect,it} from "vitest";
import {
 tpoCommunicationChangeSchema,tpoCommunicationChanges,tpoCommunicationUpdateAlreadyApplied,
} from "@/modules/placements/tpo-communication-change-model";
import {
 tpoNotificationPreferenceSaveSchema,tpoNotificationPreferenceValues,
 tpoNotificationPreferencesMatch,
} from "@/modules/placements/tpo-my-notification-preferences-model";
import {
 tpoPrepReadinessSaveSchema,tpoPrepReadinessSamePolicy,
} from "@/modules/placements/tpo-prep-readiness-save-model";

const version="2099-01-01T10:00:00.000+05:30";
const idA="11111111-1111-4111-8111-111111111111";
const idB="22222222-2222-4222-8222-222222222222";
const preferences={
 morningDigest:true,recruiterMessages:false,requests:true,
 resultsReady:true,followUps:false,expectedVersion:version,
};
describe("chat-11 exhaustive TPO settings mutation boundary and idempotency",()=>{
 it("TPO-SETTINGS-WRITE-01 accepts precisely each supported college settings section",()=>{
  const writes=[
   {section:"SMS_CAP",smsMonthlyCap:0,expectedVersion:null},
   {section:"SIGNATURE",emailSignature:"Placement Cell",expectedVersion:version},
   {section:"PREP_THRESHOLD",prepThresholdPct:75,expectedVersion:null},
   {section:"RECRUITER_DURATION",recruiterAccessMonths:12,expectedVersion:null},
   {section:"OPTIONAL_EMAILS",notifyDriveOpenEmail:true,notifyResultApplied:true,
    notifyNudges:false,notifyPrepAssigned:true,expectedVersion:version},
  ];
  const expected=[
   {smsMonthlyCap:0},{emailSignature:"Placement Cell"},{prepThresholdPct:75},
   {recruiterAccessMonths:12},
   {notifyDriveOpenEmail:true,notifyResultApplied:true,notifyNudges:false,notifyPrepAssigned:true},
  ];
  writes.forEach((item,index)=>{
   const parsed=tpoCommunicationChangeSchema.safeParse(item);
   expect(parsed.success).toBe(true);
   if(parsed.success)expect(tpoCommunicationChanges(parsed.data)).toEqual(expected[index]);
  });
 });
 it("TPO-SETTINGS-WRITE-02 refuses forged tenant, unsupported duration, invalid cap and malformed token",()=>{
  for(const raw of [
   {section:"SMS_CAP",smsMonthlyCap:1,expectedVersion:null,userId:idA},
   {section:"SMS_CAP",smsMonthlyCap:-1,expectedVersion:null},
   {section:"SMS_CAP",smsMonthlyCap:100001,expectedVersion:null},
   {section:"SMS_CAP",smsMonthlyCap:1.5,expectedVersion:null},
   {section:"PREP_THRESHOLD",prepThresholdPct:101,expectedVersion:null},
   {section:"RECRUITER_DURATION",recruiterAccessMonths:9,expectedVersion:null},
   {section:"SIGNATURE",emailSignature:"x".repeat(301),expectedVersion:null},
   {section:"SMS_CAP",smsMonthlyCap:1,expectedVersion:"yesterday"},
   {section:"DISABLE_ALL",expectedVersion:null},
  ])expect(tpoCommunicationChangeSchema.safeParse(raw).success).toBe(false);
 });
 it("TPO-SETTINGS-WRITE-03 recognizes exact section retries without overwriting changed values",()=>{
  expect(tpoCommunicationUpdateAlreadyApplied({smsMonthlyCap:500},{smsMonthlyCap:500})).toBe(true);
  expect(tpoCommunicationUpdateAlreadyApplied({smsMonthlyCap:501},{smsMonthlyCap:500})).toBe(false);
  expect(tpoCommunicationUpdateAlreadyApplied({
   notifyDriveOpenEmail:true,notifyResultApplied:true,notifyNudges:true,notifyPrepAssigned:false,
  },{
   notifyDriveOpenEmail:true,notifyResultApplied:true,notifyNudges:false,notifyPrepAssigned:false,
  })).toBe(false);
 });
 it("TPO-SETTINGS-PREF-04 refuses caller ID fields, partial switches and incorrect types",()=>{
  expect(tpoNotificationPreferenceSaveSchema.safeParse(preferences).success).toBe(true);
  for(const invalid of [
   {...preferences,collegeId:idA},{...preferences,userId:idB},
   {...preferences,followUps:"yes"},{...preferences,expectedVersion:"yesterday"},
   {...preferences,morningDigest:undefined},
  ])expect(tpoNotificationPreferenceSaveSchema.safeParse(invalid).success).toBe(false);
 });
 it("TPO-SETTINGS-PREF-05 compares all preference flags, never treating partial overlap as idempotent",()=>{
  const parsed=tpoNotificationPreferenceSaveSchema.parse(preferences);
  const current=tpoNotificationPreferenceValues(parsed);
  expect(current).not.toHaveProperty("expectedVersion");
  expect(tpoNotificationPreferencesMatch(current,{...current})).toBe(true);
  for(const key of ["morningDigest","recruiterMessages","requests","resultsReady","followUps"] as const){
   expect(tpoNotificationPreferencesMatch(current,{...current,[key]:!current[key]})).toBe(false);
  }
 });
 it("TPO-SETTINGS-PREP-06 validates a bounded unique same-policy course set and optimistic token",()=>{
  const valid={courseIds:[idA,idB],minimumCompleted:1,expectedVersion:"none"};
  expect(tpoPrepReadinessSaveSchema.safeParse(valid).success).toBe(true);
  for(const invalid of [
   {...valid,courseIds:[idA,idA]},
   {...valid,courseIds:[idA],minimumCompleted:2},
   {...valid,courseIds:[idA,"foreign"]},
   {...valid,expectedVersion:"unknown"},
   {...valid,collegeId:idA},
   {...valid,minimumCompleted:-1},
  ])expect(tpoPrepReadinessSaveSchema.safeParse(invalid).success).toBe(false);
  const policy={courseIds:[idA,idB],minimumCompleted:1};
  expect(tpoPrepReadinessSamePolicy(policy,policy)).toBe(true);
  expect(tpoPrepReadinessSamePolicy({...policy,courseIds:[idB,idA]},policy)).toBe(false);
  expect(tpoPrepReadinessSamePolicy({...policy,minimumCompleted:2},policy)).toBe(false);
  expect(tpoPrepReadinessSamePolicy(null,policy)).toBe(false);
 });
});
