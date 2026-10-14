import { describe, expect, it } from "vitest";
import { facultyScheduleFieldsChanged, facultyScheduleErrorMessage } from "@/modules/attendance/faculty-schedule-mutation-model";
import { facultyScheduleInstants, localDateTimeInput } from "@/modules/attendance/faculty-schedule-editor-model";
const current={title:"Class",description:null,location:"Room 1",startsAt:new Date("2026-10-22T04:00:30.123Z"),endsAt:new Date("2026-10-22T04:00:45.456Z")};
const original={startsAt:current.startsAt.toISOString(),endsAt:current.endsAt.toISOString()};
const next={title:"Class",description:null,location:"Room 1",...original};
describe("Faculty schedule change policy", () => {
 it("rejects semantic no-ops while recognizing metadata and instant changes", () => {
  expect(facultyScheduleFieldsChanged(current,next)).toBe(false);
  expect(facultyScheduleFieldsChanged(current,{...next,title:" Class ",description:"  "})).toBe(false);
  for(const change of [{title:"New Class"},{description:"Updated"},{location:"Room 2"},{endsAt:"2026-10-22T04:01:00Z"}])
    expect(facultyScheduleFieldsChanged(current,{...next,...change})).toBe(true);
 });
 it("preserves original second/millisecond precision for untouched minute controls", () => {
  const timing=facultyScheduleInstants(localDateTimeInput(original.startsAt),localDateTimeInput(original.endsAt),original);
  expect(timing).toEqual(original);
  expect(facultyScheduleFieldsChanged(current,{...next,...timing})).toBe(false);
  expect(facultyScheduleInstants("2026-10-22T09:30","2026-10-22T09:31",original).endsAt).toBe("2026-10-22T04:01:00.000Z");
 });
 it("renders specific stale/no-op guidance without exposing arbitrary error payloads", () => {
  expect(facultyScheduleErrorMessage({error:"FACULTY_ATTENDANCE_SCHEDULE_STALE_VERSION"})).toMatch(/another tab/);
  expect(facultyScheduleErrorMessage({error:"FACULTY_ATTENDANCE_SCHEDULE_NO_CHANGE"})).toMatch(/nothing was saved/);
  expect(facultyScheduleErrorMessage({error:"secret",token:"private"})).not.toContain("private");
 });
});
