import {describe,expect,it} from "vitest";
import {recruiterCompanyChangeRequest} from "@/modules/placements/recruiter-company-change-request-model";
describe("Recruiter profile/team change requests",()=>{
 it("sends review-only company edits, not direct mutations",()=>{
  const m=recruiterCompanyChangeRequest({
   companyName:"Infosys",kind:"PROFILE",detail:"Please update our company website",
  });
  expect(m).toContain("placement cell");
  expect(m).toContain("before updating");
  expect(m).toContain("Infosys");
 });
 it("identifies the teammate and preserves verification requirements",()=>{
  const m=recruiterCompanyChangeRequest({
   companyName:"Infosys",kind:"TEAM",
   teammate:{email:"vikram@infosys.com",name:"Vikram"},
   detail:"Allow viewing shared shortlist only",
  });
  expect(m).toContain("vikram@infosys.com");
  expect(m).toContain("grants no permissions");
 });
 it("rejects empty/short requests and team requests without an identified email",()=>{
  expect(recruiterCompanyChangeRequest({
   companyName:"Acme",kind:"PROFILE",detail:"fix",
  })).toBeNull();
  expect(recruiterCompanyChangeRequest({
   companyName:"Acme",kind:"TEAM",detail:"Add team access for this person",
  })).toBeNull();
 });
});
