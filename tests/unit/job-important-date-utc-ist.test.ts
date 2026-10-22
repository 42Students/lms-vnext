import {describe,expect,it} from "vitest";
import {importedJobImportantDates,parseImportedImportantDateUtc}
 from "@/modules/placements/job-important-date-adapter";
import {placementCalendarDayKey} from "@/modules/placements/placement-calendar-model";

describe("imported important dates (legacy UTC to IST contract)",()=>{
 it("keeps a bare civil date at UTC midnight per parseUtcDateTime",()=>{
  const date=parseImportedImportantDateUtc("2026-10-22");
  expect(date?.toISOString()).toBe("2026-10-22T00:00:00.000Z");
  expect(placementCalendarDayKey(date!)).toBe("2026-10-22");
 });
 it("treats a naive timestamp as UTC rather than runtime-local time",()=>{
  expect(parseImportedImportantDateUtc("2026-10-22 10:00:00")?.toISOString())
   .toBe("2026-10-22T10:00:00.000Z");
 });
 it("uses the +05:30 offset and groups at the exact IST-day boundary",()=>{
  const before=parseImportedImportantDateUtc("2026-10-22T00:00:00+05:30");
  const after=parseImportedImportantDateUtc("2026-10-21T18:30:00Z");
  expect(before?.toISOString()).toBe("2026-10-21T18:30:00.000Z");
  expect(placementCalendarDayKey(before!)).toBe("2026-10-22");
  expect(placementCalendarDayKey(after!)).toBe("2026-10-22");
  expect(placementCalendarDayKey(new Date("2026-10-21T18:29:59.999Z")))
   .toBe("2026-10-21");
 });
 it("preserves indexed label/type while rejecting malformed dates",()=>{
  const rows=importedJobImportantDates("job-1",{importantDates:[
   {label:"Interview",type:"ROUND",date:"2026-10-22 10:00:00"},
   {label:"Bad",date:"2026-02-30"},
   {label:"Application deadline",at:"2026-10-22T17:00:00+05:30"},
  ]});
  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({id:"important:job-1:0",
   label:"Interview",originalType:"ROUND",applicationDeadline:false});
  expect(rows[1]).toMatchObject({index:2,applicationDeadline:true});
  expect(rows[1]?.at.toISOString()).toBe("2026-10-22T11:30:00.000Z");
 });
});
