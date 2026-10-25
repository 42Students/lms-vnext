import {describe,expect,it} from "vitest";
import {recruiterColleagueWorkEmail,recruiterColleagueInviteRequestMessage}
 from "@/modules/placements/recruiter-team-invite-request-model";

describe("Recruiter Company & Team invitation requests",()=>{
 const domains=["@infosys.com","example.org"];
 it("normalizes a valid company work email without granting access",()=>{
  expect(recruiterColleagueWorkEmail("  New.Recruiter@Infosys.com  ",domains))
   .toBe("new.recruiter@infosys.com");
 });
 it("rejects addresses outside the verified work domains",()=>{
  expect(recruiterColleagueWorkEmail("recruiter@gmail.com",domains)).toBeNull();
  expect(recruiterColleagueWorkEmail("recruiter@infosys.com.evil",domains)).toBeNull();
  expect(recruiterColleagueWorkEmail("recruiter@infosys.com\nBcc: a@b.com",domains)).toBeNull();
  expect(recruiterColleagueWorkEmail("recruiter@infosys.com",[])).toBeNull();
 });
 it("builds a review request, not a claim that an account was invited",()=>{
  const body=recruiterColleagueInviteRequestMessage("a@infosys.com","Infosys","NSRIT");
  expect(body).toContain("a@infosys.com");
  expect(body).toContain("NSRIT");
  expect(body).toContain("before inviting");
  expect(body).toContain("not treat this message as a grant");
 });
});
