import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {RECRUITER_LEGACY_MOBILE_DESTINATIONS,recruiterLegacyMobileNavigation,
 recruiterLegacyHeaderCollege} from "@/modules/placements/recruiter-shell-navigation-model";

const college="11111111-2222-4333-8444-555555555555";
describe("REC-calendar-messages-profile-24 recruiter shared shell handoff",()=>{
 it("REC-calendar-messages-profile-24 retains the five exact legacy mobile destination names",()=>{
  expect(RECRUITER_LEGACY_MOBILE_DESTINATIONS.map(v=>v.label))
   .toEqual(["Today","Drives","Calendar","Messages","Company"]);
 });
 it("REC-calendar-messages-profile-24 points to real authenticated recruiter routes, never public placeholders",()=>{
  expect(RECRUITER_LEGACY_MOBILE_DESTINATIONS.map(v=>v.href)).toEqual([
   "/hr/home","/hr/drives","/hr/calendar","/hr/conversations","/hr/company"]);
 });
 it("REC-calendar-messages-profile-24 carries active college scope and nested-path highlights safely",()=>{
  const tabs=recruiterLegacyMobileNavigation("/hr/drives/anything",college);
  expect(tabs[1]?.active).toBe(true);
  expect(tabs[1]?.href).toBe("/hr/drives?collegeId="+college);
  expect(tabs[3]?.active).toBe(false);
 });
 it("REC-calendar-messages-profile-24 rejects malformed college identifiers on primary navigation",()=>{
  const tabs=recruiterLegacyMobileNavigation("/hr/home","evil?returnTo=/other");
  expect(tabs[0]?.href).toBe("/hr/home");
  expect(tabs[0]?.active).toBe(true);
 });
 it("REC-calendar-messages-profile-24 never invents an active branded college when grants are ambiguous",()=>{
  const grants=[{collegeId:college,collegeName:"College A"},
    {collegeId:"11111111-2222-4333-8444-555555555556",collegeName:"College B"}];
  expect(recruiterLegacyHeaderCollege(grants,null)).toBe(null);
  expect(recruiterLegacyHeaderCollege(grants,college)).toEqual({collegeId:college,collegeName:"College A"});
  expect(recruiterLegacyHeaderCollege([grants[0]],null)).toEqual({collegeId:college,collegeName:"College A"});
  expect(recruiterLegacyHeaderCollege(grants,"unknown")).toBe(null);
 });
 it("REC-calendar-messages-profile-24 keeps shared shell ownership until the audited playbook",()=>{
  const shell=readFileSync("src/components/shell/app-shell.tsx","utf8");
  expect(shell).toContain("getShellNavigation");
  // This contract belongs outside the shared shell to avoid cross-lane changes.
  expect(readFileSync("src/modules/placements/recruiter-shell-navigation-model.ts","utf8"))
   .toContain("Shared shell remains owned by chat-9");
 });
});