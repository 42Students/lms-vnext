import {describe,it,expect} from "vitest";
import {assertCompatibleCollegeRoleDirectoryFilters,collegeRoleDirectoryQuerySchema} from "@/modules/people/college-role-directory-model";
import {parseCollegeRoleDirectoryExportQuery} from "@/modules/people/college-role-directory-export";
describe("College role-specific directory input compatibility",()=>{
 const id="00000000-0000-4000-8000-000000000123";
 it("blocks learner academic-only inputs on Faculty screens and CSV",()=>{
  for(const raw of [{programId:id},{sectionId:id},{enrollment:"NONE"},{rollPresence:"PRESENT"}]){
   expect(()=>assertCompatibleCollegeRoleDirectoryFilters("FACULTY",collegeRoleDirectoryQuerySchema.parse(raw))).toThrow();
   expect(()=>parseCollegeRoleDirectoryExportQuery(new URLSearchParams({kind:"FACULTY",...raw}))).toThrow("INVALID_ROLE_DIRECTORY_EXPORT");
  }
 });
 it("blocks Faculty-only filters on Students and leaves normal reads valid",()=>{
  for(const raw of [{employmentType:"VISITING"},{teaching:"ASSIGNED"},{titlePresence:"PRESENT"},{facultyDepartmentId:id}]){
   expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",collegeRoleDirectoryQuerySchema.parse(raw))).toThrow();
  }
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",collegeRoleDirectoryQuerySchema.parse({}))).not.toThrow();
 });
});
