import {describe,expect,it} from "vitest";
import {filterLearnerAttendanceHistory} from "@/modules/attendance/learner-attendance-history-model";
const rows=[
  {id:"1",status:"PRESENT"},{id:"2",status:"NOT_MARKED"},
  {id:"3",status:"SCHEDULED"},{id:"4",status:"LATE"},
  {id:"5",status:"MEDICAL"},{id:"6",status:"ABSENT"},
];
describe("learner attendance session history status filter",()=>{
  it("does not reclassify unmarked or future sessions as absent",()=>{
    expect(filterLearnerAttendanceHistory(rows,"ABSENT").map(row=>row.id)).toEqual(["6"]);
    expect(filterLearnerAttendanceHistory(rows,"NOT_MARKED").map(row=>row.id)).toEqual(["2"]);
    expect(filterLearnerAttendanceHistory(rows,"OTHER").map(row=>row.id)).toEqual(["4","5"]);
  });
  it("invalid URL filter cannot broaden the original authorized collection",()=>{
    expect(filterLearnerAttendanceHistory(rows,"../../foreign")).toEqual(rows);
  });
});
