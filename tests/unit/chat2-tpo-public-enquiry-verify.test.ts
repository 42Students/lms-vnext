import { describe,expect,it } from "vitest";
import { publicRecruitEnquirySchema } from "@/modules/placements/public-enquiry/recruit-service";
const good={email:"recruiter@business.example",code:"010101",
 name:"Recruiter Name",company:"Business",mobile:"",hiringFor:""};
describe("TPO-campaigns-public-31 recruiter confirmation validation",()=>{
 it("requires a six-digit code and immutable email scope",()=>{
  expect(publicRecruitEnquirySchema.safeParse(good).success).toBe(true);
  expect(publicRecruitEnquirySchema.safeParse({...good,code:"1010"}).success).toBe(false);
  expect(publicRecruitEnquirySchema.safeParse({...good,email:"gmail@gmail.com"}).success).toBe(false);
 });
 it("rejects arbitrary college, source, grant and owner overrides",()=>{
  expect(publicRecruitEnquirySchema.safeParse({...good,collegeId:"forged"}).success).toBe(false);
  expect(publicRecruitEnquirySchema.safeParse({...good,source:"MANUAL"}).success).toBe(false);
  expect(publicRecruitEnquirySchema.safeParse({...good,ownerMembershipId:"forged"}).success).toBe(false);
 });
});
