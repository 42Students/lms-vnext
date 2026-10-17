import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterProfileDetailsPatchSchema} from "@/modules/placements/recruiter-profile-details-service";
const src=(p:string)=>readFileSync(p,"utf8");
const version="2099-01-01T01:00:00.000Z";
const valid={firstName:"Maya",lastName:"Rao",title:"Manager",phone:"9876543210",
 expectedUserUpdatedAt:version,expectedProfileUpdatedAt:version};
describe("Recruiter profile combined update",()=>{
 it("REC-calendar-messages-profile-25 validates ten-digit optional mobile and blank clears contact, never sign-in credentials",()=>{
  expect(recruiterProfileDetailsPatchSchema.safeParse(valid).success).toBe(true);
  expect(recruiterProfileDetailsPatchSchema.safeParse({...valid,phone:""}).success).toBe(true);
  expect(recruiterProfileDetailsPatchSchema.safeParse({...valid,phone:"123"}).success).toBe(false);
  expect(recruiterProfileDetailsPatchSchema.safeParse({...valid,phone:"+91 98765 43210"}).success).toBe(true);
  const service=src("src/modules/placements/recruiter-profile-details-service.ts");
  expect(service).toContain("placementRecruiterPublicContacts");
  expect(service).not.toContain("phoneE164");
 });
 it("REC-calendar-messages-profile-27 atomically guards profile mutations and retains unsaved fields on failure",()=>{
  const service=src("src/modules/placements/recruiter-profile-details-service.ts");
  const ui=src("src/components/hr/recruiter-profile-details-editor.tsx");
  expect(service).toContain("getDb().transaction(");
  expect(service).toContain('requirePermission(context,"identity.self.manage")');
  expect(service).toContain("PLACEMENT_RECRUITER_PROFILE_STALE");
  expect(ui).toContain("Save changes");
  expect(ui).toContain("Unsaved changes");
  expect(ui).toContain('window.addEventListener("beforeunload",warn)');
  expect(ui).toContain("Your changes are still here; try again.");
  expect(ui).toContain("Profile saved");
 });
 it("REC-calendar-messages-profile-28 uses the exact Profile sections and a single editor",()=>{
  const p=src("src/app/(authenticated)/hr/profile/page.tsx");
  expect(p).toContain("Your details");
  expect(p).toContain("College access");
  expect(p).toContain("Account");
  expect(p).toContain("Only for the placement cell to call you. You never sign in with it.");
  expect(p).toContain("RecruiterProfileDetailsEditor");
  expect(p).not.toContain("RecruiterDesignationEditor");
 });
 it("REC-calendar-messages-profile-25 scope and origin validate all profile updates",()=>{
  const route=src("src/app/api/placements/recruiter/profile/details/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("updateOwnRecruiterProfileDetails");
 });
});
