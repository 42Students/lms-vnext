import {describe,expect,it} from "vitest";
import {mentorEmailPreferenceFromSavedEvent,mentorEmailPreferenceSaveSchema}
 from "@/modules/projects/mentor-email-preference-model";
describe("Mentor email opt-in event state",()=>{
 it("defaults to off without saved consent",()=>{
  expect(mentorEmailPreferenceFromSavedEvent(null)).toEqual({
   enabled:false,version:null,
  });
 });
 it("uses latest durable event ID as version and never treats nonbool as consent",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  expect(mentorEmailPreferenceFromSavedEvent({id,metadata:{enabled:true}}))
   .toEqual({enabled:true,version:id});
  expect(mentorEmailPreferenceFromSavedEvent({id,metadata:{enabled:"true"}}).enabled)
   .toBe(false);
 });
 it("rejects spoofed tenant or expanded notification kinds",()=>{
  expect(mentorEmailPreferenceSaveSchema.safeParse({
   enabled:true,expectedVersion:null,allMessages:true,
  }).success).toBe(false);
  expect(mentorEmailPreferenceSaveSchema.safeParse({
   enabled:true,expectedVersion:"not-a-version",
  }).success).toBe(false);
 });
});
