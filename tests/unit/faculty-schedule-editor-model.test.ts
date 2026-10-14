import {describe,expect,it} from "vitest";
import {localDateTimeInput,validateFacultyScheduleWindow} from
  "@/modules/attendance/faculty-schedule-editor-model";
describe("Faculty attendance schedule editor",()=>{
  it("round trips a stored instant into browser-local minute precision",()=>{
    const iso="2026-10-22T09:15:00+05:30";
    expect(new Date(localDateTimeInput(iso)).toISOString()).toBe(
      new Date(iso).toISOString());
    expect(localDateTimeInput("invalid")).toBe("");
  });
  it("rejects missing, invalid and reversed session windows",()=>{
    expect(validateFacultyScheduleWindow("","")).toMatch(/both/);
    expect(validateFacultyScheduleWindow("bad","2026-10-22T10:00")).toMatch(/valid/);
    expect(validateFacultyScheduleWindow("2026-10-22T11:00","2026-10-22T10:00")).toMatch(/later/);
    expect(validateFacultyScheduleWindow("2026-10-22T09:00","2026-10-22T10:00")).toBeNull();
  });
});
