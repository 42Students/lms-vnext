import {describe,expect,it} from "vitest";
import {maskedEmail,maskedPhone,visibleContactDetails} from "@/modules/people/college-contacts-privacy";
describe("Contacts disclosure",()=>{
 it("never exposes learner address or phone, even when also a faculty member",()=>{
  const shown=visibleContactDetails({email:"student@College.edu",phone:"+919876543210",isLearner:true});
  expect(shown).toEqual({email:"s•••@college.edu",phone:"•••• 3210"});
  expect(JSON.stringify(shown)).not.toContain("9876543210");
  expect(JSON.stringify(shown)).not.toContain("student@");
 });
 it("handles missing or malformed contacts",()=>{
  expect(maskedEmail(null)).toBe("Not provided");
  expect(maskedEmail("invalid")).toBe("Not available");
  expect(maskedPhone(null)).toBe("Not provided");
 });
});