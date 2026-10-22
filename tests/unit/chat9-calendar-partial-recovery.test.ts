import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const calendar=readFileSync(join(process.cwd(),"src/components/placements/placement-calendar-workspace.tsx"),"utf8");
describe("TPO calendar partial-data recovery",()=>{
 it("TPO-calendar-reports-22 keeps a successful primary calendar visible when auxiliary counts fail",()=>{
  expect(calendar).toContain("const partialCalendar=");
  expect(calendar).toContain("Could not refresh {partialSummarySources.join");
  expect(calendar).toContain("The successful events remain visible.");
  expect(calendar).toContain("Missing counts are not zero.");
  expect(calendar).toContain('href={calendarHref(basePath,audience,state,{})}');
  expect(calendar).toContain("const countSourceEvents=eventTypeCountsSource?.events??[];");
  expect(calendar).toContain('value:needsKnown?overdue.length:null');
  expect(calendar).toContain('value:needsKnown&&blockedDays?.ready?blockedRounds.length:null');
  // Count chips only from a successful auxiliary read; a missing source is not zero.
  // The source retains direct access after the presence guard (also covered by TPO-calendar-reports-11).
  expect(calendar).toContain('eventTypeCountsSource?tpoCalendarChipCount(eventTypeCountsSource.events,filter.value):"unavailable"');
 });
});
