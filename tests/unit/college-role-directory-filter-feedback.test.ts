import {describe,it,expect} from "vitest";
import {collegeRoleDirectoryFilterMessage} from "@/modules/people/college-role-directory-model";
describe("College roster validation feedback remains non-leaking",()=>{
 it("explains a reversed IST date window",()=>expect(collegeRoleDirectoryFilterMessage(Error("INVALID_ROLE_DIRECTORY_DATE_WINDOW"))).toMatch(/Joined-from/));
 it("distinguishes class contradictions from Faculty teaching contradictions",()=>{
  expect(collegeRoleDirectoryFilterMessage(Error("LEARNER_CLASS_FILTER_CONFLICT"))).toMatch(/class and enrollment/);
  expect(collegeRoleDirectoryFilterMessage(Error("FACULTY_TEACHING_FILTER_CONFLICT"))).toMatch(/teaching role/);
 });
 it("never reflects private query text in an unexpected error",()=>{
  expect(collegeRoleDirectoryFilterMessage(Error("token=confidential&collegeId=foreign"))).toBe("A directory filter is invalid. No people were loaded.");
 });
});
