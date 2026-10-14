import {describe,expect,it} from "vitest";
import {learnerDashboardIstWeekDays} from "@/modules/placements/learner-dashboard-ist-week-model";
import type {PlacementDashboardEvent} from "@/modules/placements/learner-dashboard-model";
function ev(id:string,when:string):PlacementDashboardEvent{
 return {applicationId:"a",roundId:id,roundName:id,companyName:"Employer",roleTitle:"Engineer",
 kind:"INTERVIEW",when:new Date(when),rescheduled:false,href:"/learn/my-placements/interviews"};
}
describe("learner dashboard seven IST calendar dates",()=>{
 it("includes empty local days and excludes events after Sunday midnight",()=>{
  const now=new Date("2026-10-12T18:29:00Z"); // Tuesday? 2026-10-12 23:59 IST, Monday
  const days=learnerDashboardIstWeekDays([
   ev("at-start","2026-10-12T18:29:30Z"),
   ev("end","2026-10-18T18:29:59Z"),
   ev("outside","2026-10-18T18:30:00Z"),
  ],now);
  expect(days).toHaveLength(7);
  expect(days[0].date).toBe("2026-10-12");
  expect(days[6].date).toBe("2026-10-18");
  expect(days.map(d=>d.total)).toEqual([1,0,0,0,0,0,1]);
 });
 it("handles leap day and new year without local device timezone",()=>{
  expect(learnerDashboardIstWeekDays([],new Date("2028-02-28T18:30:00Z")).map(d=>d.date))
   .toEqual(["2028-02-29","2028-03-01","2028-03-02","2028-03-03","2028-03-04","2028-03-05","2028-03-06"]);
  expect(learnerDashboardIstWeekDays([],new Date("2026-12-31T19:00:00Z"))[0].date)
   .toBe("2027-01-01");
 });
});
