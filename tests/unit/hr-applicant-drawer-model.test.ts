import { describe, expect, it } from "vitest";
import { buildHrApplicantDrawer } from "@/modules/placements/hr-applicant-drawer-model";
import { hrApplicantFilterSchema } from "@/modules/placements/hr-job-applicants-model";
const uuid = "00000000-0000-4000-8000-000000000001";
const base = {id:uuid,name:"A Student",role:"Engineer",status:"SUBMITTED",screening:"SHORTLISTED",
 email:"student@example.test",submittedAt:new Date("2026-10-14T11:30:00Z")};
describe("HR applicant detail safe projection",()=>{
 it("allows contact for a shortlisted record already authorized by the caller",()=>{
  expect(buildHrApplicantDrawer([base],uuid)).toMatchObject({name:"A Student",email:"student@example.test"});
 });
 it("non-enumerates missing/unshared applicants",()=>{
  expect(buildHrApplicantDrawer([base],"00000000-0000-4000-8000-000000000002")).toBeNull();
  expect(buildHrApplicantDrawer([{...base,screening:"PENDING"}],uuid)).toBeNull();
  expect(buildHrApplicantDrawer([base],undefined)).toBeNull();
 });
 it("parses drawer targets strictly",()=>{
  expect(hrApplicantFilterSchema.safeParse({tab:"applicants",applicant:uuid}).success).toBe(true);
  expect(hrApplicantFilterSchema.safeParse({applicant:"not-an-id"}).success).toBe(false);
 });
});
