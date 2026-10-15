import {describe,it,expect} from "vitest";
import {sortLearnerAttendanceHistory} from "@/modules/attendance/learner-attendance-history-order-model";
const data=[{id:"b",startsAt:"2026-10-14T09:00:00Z"},{id:"a",startsAt:"2026-10-15T09:00:00Z"}];
describe("learner attendance chronological order",()=>{
 it("orders marked/scheduled history by actual instants without mutation",()=>{
  expect(sortLearnerAttendanceHistory(data,"NEWEST").map(x=>x.id)).toEqual(["a","b"]);
  expect(sortLearnerAttendanceHistory(data,"OLDEST").map(x=>x.id)).toEqual(["b","a"]);
  expect(data[0]?.id).toBe("b");
 });
 it("rejects unknown modes by returning the predictable newest order",()=>{
  expect(sortLearnerAttendanceHistory(data,"../../foreign").map(x=>x.id)).toEqual(["a","b"]);
 });
});
