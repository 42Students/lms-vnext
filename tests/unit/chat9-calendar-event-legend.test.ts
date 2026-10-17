import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("TPO Calendar kind legend",()=>{
 it("TPO-calendar-reports-11 renders counted color chips and supports multi-kind selection",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/placements/placement-calendar-workspace.tsx"),"utf8");
  expect(source).toContain("TPO_CALENDAR_CHIP_CHOICES.map(filter");
  expect(source).toContain("tpoCalendarChipCount(eventTypeCountsSource.events,filter.value)");
  expect(source).toContain("toggleTpoCalendarChip(currently,filter.value)");
  expect(source).toContain("Select multiple event types to combine them");
  expect(source).toContain('filter.value==="BLOCKED"');
  expect(source).toContain('filter.value==="FOLLOW_UP"');
  expect(source).toContain('name="kind"');
 });
});