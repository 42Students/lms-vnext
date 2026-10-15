import {describe,it,expect} from "vitest";
import {sortLearnerAttendanceHistory} from "@/modules/attendance/learner-attendance-history-order-model";
const rows=[
 {id:"bad",startsAt:"corrupt"},
 {id:"old",startsAt:"2026-09-01T10:00:00Z"},
 {id:"new",startsAt:"2026-10-01T10:00:00Z"},
];
describe("learner Attendance malformed session timestamps",()=>{
 it("sorts valid records before invalid ones in both directions",()=>{
  expect(sortLearnerAttendanceHistory(rows,"NEWEST").map(x=>x.id)).toEqual(["new","old","bad"]);
  expect(sortLearnerAttendanceHistory(rows,"OLDEST").map(x=>x.id)).toEqual(["old","new","bad"]);
 });
});
