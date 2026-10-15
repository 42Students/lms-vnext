import {describe,it,expect} from "vitest";
import {filterLearnerAttendanceMonth,learnerAttendanceIstMonth} from "@/modules/attendance/learner-attendance-filter-model";
const course="82828282-8282-4828-8828-828282828282";
describe("learner Attendance corrupted date filtering",()=>{
 it("skips malformed dates without crashing the entire authorized history",()=>{
  expect(learnerAttendanceIstMonth("not-a-date")).toBe("");
  const records=[{deliveryId:course,startsAt:"bad",id:"bad"},
   {deliveryId:course,startsAt:"2026-10-15T20:00:00Z",id:"valid"}];
  expect(filterLearnerAttendanceMonth(records,course,"2026-10").map(x=>x.id)).toEqual(["valid"]);
 });
});
