import {describe,it,expect} from "vitest";
import {filterLearnerAttendanceHistory} from "@/modules/attendance/learner-attendance-history-model";
const rows=["PRESENT","ABSENT","LATE","EXCUSED","MEDICAL","NOT_MARKED","SCHEDULED"].map(status=>({status}));
describe("learner attendance exception granularity",()=>{
 it("provides exact persisted late, excused and medical filters",()=>{
  for(const status of ["LATE","EXCUSED","MEDICAL"]){
   expect(filterLearnerAttendanceHistory(rows,status)).toEqual([{status}]);
  }
 });
 it("retains the grouped exception filter and never reclassifies absent as excused",()=>{
  expect(filterLearnerAttendanceHistory(rows,"OTHER").map(x=>x.status)).toEqual(["LATE","EXCUSED","MEDICAL"]);
  expect(filterLearnerAttendanceHistory(rows,"ABSENT")).toEqual([{status:"ABSENT"}]);
 });
});
