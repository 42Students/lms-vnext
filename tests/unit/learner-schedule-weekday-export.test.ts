import {describe,it,expect} from "vitest";
import {learnerScheduleWeekdayExportAvailable} from "@/modules/academics/learner-schedule-weekday-export-model";
describe("learner class Week/Day ICS export visibility",()=>{
 it("offers a selected day download only when authorized events exist",()=>{
  expect(learnerScheduleWeekdayExportAvailable("week","IST",3)).toBe(true);
  expect(learnerScheduleWeekdayExportAvailable("day","IST",1)).toBe(true);
  expect(learnerScheduleWeekdayExportAvailable("week","IST",0)).toBe(false);
 });
 it("avoids ambiguous LOCAL and duplicate Month controls",()=>{
  expect(learnerScheduleWeekdayExportAvailable("week","LOCAL",2)).toBe(false);
  expect(learnerScheduleWeekdayExportAvailable("month","IST",2)).toBe(false);
 });
});
