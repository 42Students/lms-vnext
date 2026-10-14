import {describe,expect,it} from "vitest";
import {facultyAttendanceScheduleSchema} from "@/modules/attendance/faculty-schedule-mutation-model";
const id="00000000-0000-4000-8000-000000000001";
const time={startsAt:"2026-10-22T09:00:00+05:30",endsAt:"2026-10-22T10:00:00+05:30"};
describe("Faculty attendance schedule input",()=>{
 it("requires exact fields and confirmation",()=>{
  const input={action:"CREATE",title:"Class session",description:null,location:null,...time,confirm:true};
  expect(facultyAttendanceScheduleSchema.safeParse(input).success).toBe(true);
  expect(facultyAttendanceScheduleSchema.safeParse({...input,confirm:false}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...input,endsAt:time.startsAt}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...input,startsAt:"2026-10-22T09:00"}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...input,collegeId:id}).success).toBe(false);
 });
 it("rejects reschedule without UUID, optimistic token or valid action",()=>{
  const input={action:"RESCHEDULE",sessionId:id,expectedUpdatedAt:time.startsAt,
    title:"Move session",description:null,location:null,...time,confirm:true};
  expect(facultyAttendanceScheduleSchema.safeParse(input).success).toBe(true);
  expect(facultyAttendanceScheduleSchema.safeParse({...input,sessionId:"bad"}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...input,expectedUpdatedAt:undefined}).success).toBe(false);
 });
});
