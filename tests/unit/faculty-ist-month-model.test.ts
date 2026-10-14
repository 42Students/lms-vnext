import { describe,expect,it } from "vitest";
import {
  currentIstMonth,facultyMonthGrid,facultyMonthHref,facultyMonthQuerySchema,
  istDateKey,shiftMonth,
} from "@/modules/courses/faculty-ist-month-model";
const first="00000000-0000-4000-8000-000000000001";
const second="00000000-0000-4000-8000-000000000002";
const courses=[{deliveryId:first,sectionId:"A",courseCode:"CS101",courseName:"Algorithms"},
  {deliveryId:second,sectionId:"B",courseCode:"CS201",courseName:"Databases"}];
const events=[
  {id:"1",sectionId:"A",deliveryId:first,title:"Evening class",
    startsAt:new Date("2026-10-13T18:15:00Z"),
    endsAt:new Date("2026-10-13T19:00:00Z")},
  {id:"2",sectionId:"B",deliveryId:second,title:"Unrelated",
    startsAt:new Date("2026-10-14T12:30:00Z"),
    endsAt:new Date("2026-10-14T13:00:00Z")},
  {id:"3",sectionId:"A",deliveryId:null,title:"Section-wide",
    startsAt:new Date("2026-10-14T18:00:00Z"),
    endsAt:new Date("2026-10-14T19:30:00Z")},
];
describe("Faculty IST persisted session month",()=>{
  it("interprets midnight in Asia/Kolkata, not the browser timezone",()=>{
    expect(istDateKey(new Date("2026-10-13T18:15:00Z"))).toBe("2026-10-13");
    expect(istDateKey(new Date("2026-10-13T19:00:00Z"))).toBe("2026-10-14");
    expect(currentIstMonth(new Date("2026-09-30T20:00:00Z"))).toBe("2026-10");
  });
  it("renders a stable 42-cell grid, carrying overnight sessions to both dates",()=>{
    const grid=facultyMonthGrid(events,courses,{month:"2026-10",deliveryId:first});
    expect(grid.authorized).toBe(true);
    expect(grid.days).toHaveLength(42);
    expect(grid.days.find(day=>day.key==="2026-10-13")?.events.map(x=>x.id)).toContain("1");
    expect(grid.days.find(day=>day.key==="2026-10-14")?.events.map(x=>x.id)).toContain("1");
    expect(grid.days.find(day=>day.key==="2026-10-15")?.events.map(x=>x.id)).toContain("3");
    expect(grid.events.map(x=>x.id)).not.toContain("2");
  });
  it("denies foreign delivery selectors and invalid calendar months",()=>{
    expect(facultyMonthGrid(events,courses,{
      month:"2026-10",deliveryId:"00000000-0000-4000-8000-000000000009",
    }).authorized).toBe(false);
    expect(facultyMonthQuerySchema.safeParse({month:"2026-13"}).success).toBe(false);
    expect(facultyMonthQuerySchema.safeParse({month:"2026-10",collegeId:"foreign"}).success).toBe(false);
    expect(shiftMonth("2026-12",1)).toBe("2027-01");
    expect(facultyMonthHref({month:"2026-10",deliveryId:first}))
      .toBe("/teacher/calendar?month=2026-10&deliveryId="+first);
  });
});
