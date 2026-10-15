import {describe,it,expect} from "vitest";
import {filterTpoStudentRoster,type TpoStudentRow} from "@/modules/placements/tpo-students-model";
describe("TPO Students after-college filter",()=>{
 const a={membershipId:"a",displayName:"A",email:null,rollNumber:null,registrationNumber:null,
  branchId:"b",branchName:"B",cohortName:"C",afterCollegeOutcome:"HIGHER_STUDIES"} as TpoStudentRow;
 const b={...a,membershipId:"b",afterCollegeOutcome:null};
 it("filters prior to pagination and treats unset as not decided",()=>{
  const all={page:1,pageSize:10};
  expect(filterTpoStudentRoster([a,b],{...all,afterCollege:"HIGHER_STUDIES"}).total).toBe(1);
  expect(filterTpoStudentRoster([a,b],{...all,afterCollege:"NOT_DECIDED"}).items[0]?.membershipId).toBe("b");
 });
});
