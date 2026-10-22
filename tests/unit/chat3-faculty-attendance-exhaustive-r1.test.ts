import {describe,it,expect} from "vitest";
import {facultyAttendanceMarkingWindow} from "@/modules/attendance/faculty-marking-window";
import {facultyAttendanceCorrectionTokenMatches,facultyAttendanceNextMarkedAt} from "@/modules/attendance/faculty-correction-token-model";
import {facultyAttendanceScheduleSchema,facultyScheduleFieldsChanged,facultyScheduleErrorMessage} from "@/modules/attendance/faculty-schedule-mutation-model";
const time=(minute:number)=>new Date(Date.UTC(2026,9,18,9,minute));
const base={startsAt:time(0),endsAt:time(30),correctionWindowHours:1,now:time(45)};
describe("FAC attendance time, edit-state and version boundaries",()=>{
 it("FAC-ATT-01 marking is denied before class, open during correction window, expired strictly after it",()=>{
  expect(facultyAttendanceMarkingWindow({...base,now:new Date(time(0).getTime()-1)})).toBe("NOT_STARTED");
  expect(facultyAttendanceMarkingWindow({...base,now:time(0)})).toBe("OPEN");
  expect(facultyAttendanceMarkingWindow({...base,now:time(30)})).toBe("OPEN");
  expect(facultyAttendanceMarkingWindow({...base,now:new Date(time(30).getTime()+3600000)})).toBe("OPEN");
  expect(facultyAttendanceMarkingWindow({...base,now:new Date(time(30).getTime()+3600001)})).toBe("WINDOW_EXPIRED");
 });
 it("FAC-ATT-02 invalid session, clock or policy fails closed",()=>{
  for(const bad of [{startsAt:new Date(NaN)},{endsAt:time(0)},{correctionWindowHours:-1},{correctionWindowHours:Infinity},{now:new Date(NaN)}])
   expect(facultyAttendanceMarkingWindow({...base,...bad})).toBe("WINDOW_EXPIRED");
 });
 it("FAC-ATT-03 only exact last persisted millisecond token may update MARKED attendance",()=>{
  const d=new Date("2026-10-18T09:00:00.123Z");
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",d,d.toISOString())).toBe(true);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",d,"2026-10-18T09:00:00.122Z")).toBe(false);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",d,"bad")).toBe(false);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",d,null)).toBe(false);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",null,d.toISOString())).toBe(false);
  expect(facultyAttendanceCorrectionTokenMatches(null,null,undefined)).toBe(true);
  expect(facultyAttendanceCorrectionTokenMatches("ABSENT",null,null)).toBe(true);
  expect(facultyAttendanceCorrectionTokenMatches(null,null,d.toISOString())).toBe(false);
 });
 it("FAC-ATT-04 new markedAt always advances despite same or earlier clock readings",()=>{
  const now=new Date("2026-10-18T09:00:00.000Z");
  expect(facultyAttendanceNextMarkedAt(now,null).getTime()).toBe(now.getTime());
  expect(facultyAttendanceNextMarkedAt(now,now).getTime()).toBe(now.getTime()+1);
  expect(facultyAttendanceNextMarkedAt(now,new Date(now.getTime()+50)).getTime()).toBe(now.getTime()+51);
 });
 it("FAC-ATT-05 schedule schema requires confirmation, strict inputs and valid ordering",()=>{
  const good={action:"CREATE",confirm:true,title:"Lab attendance",description:null,location:null,
   startsAt:"2026-10-18T09:00:00.000Z",endsAt:"2026-10-18T10:00:00.000Z"};
  expect(facultyAttendanceScheduleSchema.safeParse(good).success).toBe(true);
  expect(facultyAttendanceScheduleSchema.safeParse({...good,confirm:false}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...good,endsAt:good.startsAt}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...good,title:"x"}).success).toBe(true);
  expect(facultyAttendanceScheduleSchema.safeParse({...good,title:"x".repeat(161)}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...good,unexpected:true}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...good,action:"RESCHEDULE",sessionId:"bad",expectedUpdatedAt:good.startsAt}).success).toBe(false);
  expect(facultyAttendanceScheduleSchema.safeParse({...good,action:"RESCHEDULE",sessionId:"11111111-1111-4111-8111-111111111111",expectedUpdatedAt:good.startsAt}).success).toBe(true);
 });
 it("FAC-ATT-06 schedule change detection is idempotent and canonical for whitespace and instants",()=>{
  const now={title:"Lab",description:null,location:"Room A",startsAt:time(0),endsAt:time(30)};
  const next={title:" Lab ",description:" ",location:"Room A",startsAt:time(0).toISOString(),endsAt:time(30).toISOString()};
  expect(facultyScheduleFieldsChanged(now,next)).toBe(false);
  expect(facultyScheduleFieldsChanged(now,{...next,location:"Room B"})).toBe(true);
  expect(facultyScheduleFieldsChanged(now,{...next,endsAt:time(45).toISOString()})).toBe(true);
 });
 it("FAC-ATT-07 only recognized schedule errors reach UI as friendly text",()=>{
  expect(facultyScheduleErrorMessage({error:"FACULTY_ATTENDANCE_SCHEDULE_STALE_VERSION"})).toMatch(/changed in another tab/i);
  expect(facultyScheduleErrorMessage({error:"FACULTY_ATTENDANCE_SCHEDULE_NO_CHANGE"})).toMatch(/nothing was saved/i);
  expect(facultyScheduleErrorMessage({error:"INTERNAL_STACK"})).not.toContain("INTERNAL_STACK");
  expect(facultyScheduleErrorMessage({error:"FACULTY_ATTENDANCE_SCHEDULE_STALE_VERSION",trace:"SECRET"})).toContain("Session was not saved");
 });
});