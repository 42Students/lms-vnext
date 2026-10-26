import {describe,expect,it} from "vitest";
import {facultyCourseMonthAttendanceEvidence,facultyCourseMonthAttendancePercent}
 from "../../src/modules/courses/faculty-course-month-attendance-model";

const now=new Date("2026-10-26T09:00:00+05:30");
const roster=[{membershipId:"learner-a"},{membershipId:"learner-b"}];
const sessions=[
 {id:"marked-1",startsAt:new Date("2026-10-20T09:00:00+05:30"),attendanceStatus:"MARKED"},
 {id:"marked-2",startsAt:new Date("2026-10-21T09:00:00+05:30"),attendanceStatus:"MARKED"},
 {id:"unmarked",startsAt:new Date("2026-10-22T09:00:00+05:30"),attendanceStatus:"UNMARKED"},
 {id:"future",startsAt:new Date("2026-10-28T09:00:00+05:30"),attendanceStatus:"MARKED"},
];
describe("Faculty Courses monthly attendance",()=>{
 it("counts an empty marked exception list as all learners present",()=>{
  expect(facultyCourseMonthAttendancePercent({roster,sessions,records:[]},now)).toBe(100);
 });
 it("weights by authorized learner-session opportunities and deduplicates exception rows",()=>{
  const data={roster,sessions,records:[
   {scheduleEventId:"marked-1",membershipId:"learner-a",status:"ABSENT"},
   {scheduleEventId:"marked-1",membershipId:"learner-a",status:"ABSENT"},
   {scheduleEventId:"marked-2",membershipId:"learner-b",status:"LATE"},
   {scheduleEventId:"unmarked",membershipId:"learner-a",status:"ABSENT"},
   {scheduleEventId:"marked-1",membershipId:"not-on-roster",status:"MEDICAL"},
   {scheduleEventId:"future",membershipId:"learner-b",status:"ABSENT"},
  ]};
  expect(facultyCourseMonthAttendanceEvidence(data,now)).toEqual({present:2,possible:4});
  expect(facultyCourseMonthAttendancePercent(data,now)).toBe(50);
 });
 it("does not invent a zero percentage without marked sessions or roster",()=>{
  expect(facultyCourseMonthAttendancePercent({roster,sessions:[],records:[]},now)).toBeNull();
  expect(facultyCourseMonthAttendancePercent({roster:[],sessions,records:[]},now)).toBeNull();
 });
});
