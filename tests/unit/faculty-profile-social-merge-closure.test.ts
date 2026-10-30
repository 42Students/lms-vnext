import {describe,expect,it} from "vitest";
import {facultyProfileDocumentSchema} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
const document=facultyProfileDocumentSchema.parse({
 socialProfiles:{
  linkedIn:"https://www.linkedin.com/in/prior",
  codingProfiles:{LeetCode:"https://leetcode.com/u/test"},
  codingProfileLinks:["https://codeforces.com/profile/test"],
 },
});
describe("Faculty social-profile partial edit preserves historical links",()=>{
 it("updates LinkedIn without losing separate coding-profile records hidden by the form",()=>{
  const next=updateFacultyProfileSection(document,{section:"socialProfiles",
   value:{linkedIn:"https://www.linkedin.com/in/updated"},expectedVersion:1});
  expect(next.socialProfiles.linkedIn).toBe("https://www.linkedin.com/in/updated");
  expect(next.socialProfiles.codingProfiles).toEqual(document.socialProfiles.codingProfiles);
  expect(next.socialProfiles.codingProfileLinks).toEqual(document.socialProfiles.codingProfileLinks);
 });
 it("allows an intentional nested HTTPS update but denies new insecure URLs",()=>{
  const next=updateFacultyProfileSection(document,{section:"socialProfiles",
   value:{codingProfiles:{LeetCode:"https://leetcode.com/u/new"}},expectedVersion:1});
  expect(next.socialProfiles.codingProfiles.LeetCode).toBe("https://leetcode.com/u/new");
  expect(next.socialProfiles.linkedIn).toBe(document.socialProfiles.linkedIn);
  for(const value of [
   {linkedIn:"javascript:alert(1)"},{codingProfiles:{LeetCode:"http://example.com"}},
   {codingProfileLinks:["https://localhost/probe"]},{unknownKey:"https://example.com"},
  ])expect(()=>updateFacultyProfileSection(document,{
   section:"socialProfiles",value,expectedVersion:1,
  })).toThrow();
 });
});
