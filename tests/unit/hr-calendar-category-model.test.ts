import {describe,expect,it} from "vitest";
import {HR_CALENDAR_CATEGORIES,hrCalendarCategorySchema,filterHrCalendarDays}
 from "@/modules/placements/hr-calendar-category-model";
describe("HR calendar kind filters",()=>{
 it("keeps due dates separate from rounds and deadlines",()=>{
  const days=[{day:"2026-10-15",
   events:[{kind:"APPLICATION_DEADLINE"},{kind:"ROUND"}],resultsDue:[{id:"due"}]}];
  expect(filterHrCalendarDays(days as unknown as import("@/modules/placements/hr-calendar-category-model").HrCalendarFilterDay[],"ROUNDS")[0]).toMatchObject({
   events:[{kind:"ROUND"}],resultsDue:[],
  });
  expect(filterHrCalendarDays(days as unknown as import("@/modules/placements/hr-calendar-category-model").HrCalendarFilterDay[],"DEADLINES")[0]?.events).toHaveLength(1);
  expect(filterHrCalendarDays(days as unknown as import("@/modules/placements/hr-calendar-category-model").HrCalendarFilterDay[],"RESULTS_DUE")[0]?.resultsDue).toHaveLength(1);
  expect(filterHrCalendarDays(days as unknown as import("@/modules/placements/hr-calendar-category-model").HrCalendarFilterDay[],"ALL")[0]?.events).toHaveLength(2);
 });
 it("does not accept fake calendar event types",()=>{
  expect(HR_CALENDAR_CATEGORIES).toHaveLength(4);
  expect(hrCalendarCategorySchema.safeParse("SLOT").success).toBe(false);
 });
});
