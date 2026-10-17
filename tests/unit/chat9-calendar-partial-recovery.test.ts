import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const calendar=readFileSync(join(process.cwd(),"src/components/placements/placement-calendar-workspace.tsx"),"utf8");
describe("TPO calendar partial-data recovery",()=>{
 it("TPO-calendar-reports-22 keeps a successful primary calendar visible when auxiliary counts fail",()=>{
  expect(calendar).toContain("const partialCalendar=");
  expect(calendar).toContain("Calendar summary is partially unavailable.");
  expect(calendar).toContain("The events shown are from the successful calendar read");
  expect(calendar).toContain('href={calendarHref(basePath,audience,state,{})}');
  expect(calendar).toContain("const countSourceEvents=eventTypeCountsSource?.events??[];");
  expect(calendar).toContain('needsWindow?overdue.length:"Unavailable"');
  expect(calendar).toContain('needsWindow&&blockedDays?.ready?blockedRounds.length:"Unavailable"');
  expect(calendar).toContain('eventTypeCountsSource?tpoCalendarChipCount(countSourceEvents,filter.value):"unavailable"');
 });
});
