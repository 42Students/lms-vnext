import {describe,expect,it} from "vitest";
import {selectTpoStudentWorkingSet,type TpoStudentRow} from "@/modules/placements/tpo-students-model";
describe("TPO-students-01 TPO-students-R01 working set",()=>{
 it("defaults to eligible; explicit batch permits historical completed learners",()=>{
  const item=(id:string,status:TpoStudentRow["participationStatus"],finished=false)=>
    ({membershipId:id,participationStatus:status,fromFinishedBatch:finished} as TpoStudentRow);
  const rows=[item("eligible","ELIGIBLE"),item("undecided","NOT_DECIDED"),
    item("historical","INELIGIBLE",true)];
  expect(selectTpoStudentWorkingSet(rows,false).map(x=>x.membershipId))
    .toEqual(["eligible"]);
  expect(selectTpoStudentWorkingSet(rows,true).map(x=>x.membershipId))
    .toEqual(["eligible","historical"]);
 });
});