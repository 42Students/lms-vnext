import {describe,expect,it} from "vitest";
import {facultyStudentRosterMetrics} from "@/modules/courses/faculty-student-roster-metrics";
describe("faculty prototype precise roster metrics",()=>{
 const now=new Date("2026-10-26T12:00:00Z");
 const data={
  roster:[{membershipId:"A"},{membershipId:"B"}],
  attendanceSessions:[
   {id:"s1",startsAt:new Date("2026-10-20T12:00:00Z"),attendanceStatus:"MARKED"},
   {id:"s2",startsAt:new Date("2026-10-21T12:00:00Z"),attendanceStatus:"MARKED"},
   {id:"s3",startsAt:new Date("2026-10-28T12:00:00Z"),attendanceStatus:"MARKED"},
  ],
  attendanceRecords:[
   {scheduleEventId:"s1",membershipId:"A",status:"ABSENT"},
   {scheduleEventId:"s1",membershipId:"A",status:"ABSENT"},
   {scheduleEventId:"s2",membershipId:"not-in-class",status:"ABSENT"},
   {scheduleEventId:"s3",membershipId:"B",status:"ABSENT"},
  ],
  assignments:[
   {id:"a1",status:"PUBLISHED",dueAt:new Date("2026-10-24T00:00:00Z"),
    submissions:[{membershipId:"A"},{membershipId:"B"}]},
   {id:"a2",status:"PUBLISHED",dueAt:new Date("2026-10-25T00:00:00Z"),
    submissions:[{membershipId:"B"}]},
   {id:"a3",status:"DRAFT",dueAt:new Date("2026-10-25T00:00:00Z"),
    submissions:[]},
  ],
 };
 it("uses real attendance denominator and actual published assignments",()=>{
  const result=facultyStudentRosterMetrics(data,now);
  expect(result.byLearner).toEqual([
   {membershipId:"A",assignmentProgressPercent:50,submittedAssignments:1,
    totalAssignments:2,attendancePercent:50,overdueMissing:1},
   {membershipId:"B",assignmentProgressPercent:100,submittedAssignments:2,
    totalAssignments:2,attendancePercent:100,overdueMissing:0},
  ]);
  expect(result.behindTotal).toBe(1);
  expect(result.lowAttendanceTotal).toBe(1);
 });
 it("does not fabricate percentages when no records exist",()=>{
  const result=facultyStudentRosterMetrics({
   roster:data.roster,attendanceSessions:[],attendanceRecords:[],assignments:[],
  },now);
  expect(result.byLearner[0]?.attendancePercent).toBeNull();
  expect(result.byLearner[0]?.assignmentProgressPercent).toBeNull();
 });
});
