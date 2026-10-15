import {it,expect} from "vitest";
import {filterTpoStudentRoster,type TpoStudentRow} from "@/modules/placements/tpo-students-model";
it("shows only actual verified GitHub profiles under the coding-platform filter",()=>{
 const first={membershipId:"a",displayName:"A",branchName:"B",cohortName:"C",
  codingGithubUrl:"https://github.com/safe"} as TpoStudentRow;
 const second={...first,membershipId:"b",codingGithubUrl:null};
 expect(filterTpoStudentRoster([first,second],{codingPlatform:"GITHUB",page:1,pageSize:25}).items)
  .toHaveLength(1);
});