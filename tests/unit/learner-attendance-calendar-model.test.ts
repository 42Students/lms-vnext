import { describe, expect, it } from "vitest";
import {
  attendanceCalendarCurrentMonth,
  attendanceCalendarDayKey, attendanceCalendarDays,
  attendanceCalendarHref, attendanceCalendarSummary,
  learnerAttendanceCalendarQuerySchema, parseAttendanceCalendarQuery,
  selectAttendanceCalendarRecords, shiftAttendanceCalendarMonth,
  type LearnerAttendanceCalendarRecord,
} from "@/modules/attendance/learner-attendance-calendar-model";

const id="00000000-0000-4000-8000-000000000001";
const rows:LearnerAttendanceCalendarRecord[]=[
  {id:"a",deliveryId:id,courseName:"Java",courseCode:"JAVA",
    title:"Marked absent",startsAt:new Date("2025-03-10T18:45:00Z"),
    endsAt:new Date("2025-03-10T19:45:00Z"),status:"ABSENT"},
  {id:"b",deliveryId:id,courseName:"Java",courseCode:"JAVA",
    title:"Pending mark",startsAt:new Date("2025-03-10T04:00:00Z"),
    endsAt:new Date("2025-03-10T05:00:00Z"),status:"NOT_MARKED"},
  {id:"c",deliveryId:id,courseName:"Java",courseCode:"JAVA",
    title:"Future class",startsAt:new Date("2030-03-10T04:00:00Z"),
    endsAt:new Date("2030-03-10T05:00:00Z"),status:"SCHEDULED"},
];
describe("Learner attendance calendar model",()=>{
  it("uses India-local day keys across UTC midnight",()=>{
    expect(attendanceCalendarDayKey(new Date("2025-03-10T18:45:00Z")))
      .toBe("2025-03-11");
    expect(attendanceCalendarCurrentMonth(new Date("2025-02-28T20:00:00Z")))
      .toBe("2025-03");
  });
  it("filters by month, course and actual persisted status without fabrication",()=>{
    const query={month:"2025-03",deliveryId:id,status:"ALL" as const};
    expect(selectAttendanceCalendarRecords(rows,query).map(x=>x.id)).toEqual(["b","a"]);
    expect(selectAttendanceCalendarRecords(rows,{...query,status:"ABSENT"}).map(x=>x.id))
      .toEqual(["a"]);
    expect(selectAttendanceCalendarRecords(rows,{...query,deliveryId:
      "00000000-0000-4000-8000-000000000002"})).toEqual([]);
    expect(selectAttendanceCalendarRecords(rows,{...query,month:"2029-03"})).toEqual([]);
  });
  it("uses only marked records for the percentage denominator",()=>{
    expect(attendanceCalendarSummary([])).toMatchObject({total:0,marked:0,percentage:null});
    expect(attendanceCalendarSummary(rows)).toMatchObject({
      total:3,marked:1,scheduled:1,unmarked:1,otherMarked:1,percentage:0,
    });
  });
  it("builds accurate March and leap-year grids",()=>{
    expect(attendanceCalendarDays("2025-03").filter(Boolean)).toHaveLength(31);
    expect(attendanceCalendarDays("2024-02").filter(Boolean)).toHaveLength(29);
    expect(attendanceCalendarDays("2025-03")[0]).toBeNull();
    expect(shiftAttendanceCalendarMonth("2025-12",1)).toBe("2026-01");
    expect(shiftAttendanceCalendarMonth("2025-01",-1)).toBe("2024-12");
  });
  it("rejects extra college/owner selectors and invalid status/months",()=>{
    expect(learnerAttendanceCalendarQuerySchema.safeParse({collegeId:id}).success).toBe(false);
    expect(learnerAttendanceCalendarQuerySchema.safeParse({membershipId:id}).success).toBe(false);
    expect(learnerAttendanceCalendarQuerySchema.safeParse({month:"2025-13"}).success).toBe(false);
    expect(learnerAttendanceCalendarQuerySchema.safeParse({status:"UNKNOWN"}).success).toBe(false);
    expect(learnerAttendanceCalendarQuerySchema.safeParse({deliveryId:"not-uuid"}).success).toBe(false);
    expect(parseAttendanceCalendarQuery({},new Date("2025-03-02T10:00:00Z")))
      .toEqual({month:"2025-03",deliveryId:"ALL",status:"ALL"});
  });
  it("retains authorized filters in monthly navigation",()=>{
    expect(attendanceCalendarHref({month:"2025-03",deliveryId:id,status:"NOT_MARKED"}))
      .toBe("/learn/attendance/calendar?month=2025-03&deliveryId="+id+
        "&status=NOT_MARKED");
  });
});
