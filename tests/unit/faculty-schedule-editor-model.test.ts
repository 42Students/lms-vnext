import {describe,expect,it} from "vitest";
import {localDateTimeInput,validateFacultyScheduleWindow,facultyScheduleInstants} from
  "@/modules/attendance/faculty-schedule-editor-model";
describe("Faculty attendance schedule editor",()=>{
  it("round trips a stored instant into IST independently of the device",()=>{
    const iso="2026-10-22T09:15:00+05:30";
    expect(localDateTimeInput(iso)).toBe("2026-10-22T09:15");
    expect(facultyScheduleInstants("2026-10-22T00:15","2026-10-22T01:15")).toEqual({
      startsAt:"2026-10-21T18:45:00.000Z",endsAt:"2026-10-21T19:45:00.000Z",
    });
    expect(localDateTimeInput("invalid")).toBe("");
  });
  it("rejects missing, invalid and reversed session windows",()=>{
    expect(validateFacultyScheduleWindow("","")).toMatch(/both/);
    expect(validateFacultyScheduleWindow("2026-02-29T09:00","2026-03-01T10:00")).toMatch(/valid/);
    expect(validateFacultyScheduleWindow("bad","2026-10-22T10:00")).toMatch(/valid/);
    expect(validateFacultyScheduleWindow("2026-10-22T11:00","2026-10-22T10:00")).toMatch(/later/);
    expect(validateFacultyScheduleWindow("2026-10-22T09:00","2026-10-22T10:00")).toBeNull();
  });
});
