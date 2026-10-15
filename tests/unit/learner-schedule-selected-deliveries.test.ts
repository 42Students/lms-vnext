import {describe,it,expect} from "vitest";
import {learnerScheduleSelectedDeliveries} from "@/modules/academics/learner-schedule-selected-deliveries-model";
const courses=[{deliveryId:"own-a"},{deliveryId:"own-b"}];
describe("learner Class Schedule preselected Course membership",()=>{
 it("intersects imported selections with the server-authorized Course list",()=>{
  expect(learnerScheduleSelectedDeliveries(courses,["outside","own-b","own-b"])).toEqual(["own-b"]);
 });
 it("recovers from wholly stale deep links without guessing outside Courses",()=>{
  expect(learnerScheduleSelectedDeliveries(courses,["outside"])).toEqual(["own-a","own-b"]);
 });
 it("preserves intentional none or defaults to all when omitted",()=>{
  expect(learnerScheduleSelectedDeliveries(courses,[])).toEqual([]);
  expect(learnerScheduleSelectedDeliveries(courses)).toEqual(["own-a","own-b"]);
 });
});
