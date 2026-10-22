import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {facultyAttendanceDayCell} from "@/modules/attendance/faculty-grid-model";
import {directInterviewTimeWindow} from "@/modules/placements/hr-interview-slot-model";

describe("Verify2 lane-18: legacy attendance, interview and duration guards",()=>{
 it("does not count future sessions or excused, medical, late as absence",()=>{
  const day=facultyAttendanceDayCell([
   {id:"held",startsAt:"2026-10-21T03:00:00.000Z",attendanceStatus:"MARKED"},
   {id:"late",startsAt:"2026-10-21T04:00:00.000Z",attendanceStatus:"MARKED"},
   {id:"future",startsAt:"2026-10-23T04:00:00.000Z",attendanceStatus:null},
  ],new Map([
   ["held",{scheduleEventId:"held",membershipId:"u",status:"ABSENT"}],
   ["late",{scheduleEventId:"late",membershipId:"u",status:"MEDICAL"}],
  ]),new Date("2026-10-22T04:00:00.000Z"));
  expect(day).toMatchObject({code:"MIXED",present:1,absent:1,scheduled:1,sessionCount:2,ratio:"1/2"});
 });
 it("uses sixty minutes by default and honors configured caps",()=>{
  const start=new Date("2026-10-22T09:00:00.000Z");
  expect(directInterviewTimeWindow({startAt:start}).endAt.toISOString())
   .toBe("2026-10-22T10:00:00.000Z");
  expect(()=>directInterviewTimeWindow({startAt:start,minMinutes:90,maxMinutes:120})).toThrow();
  expect(directInterviewTimeWindow({startAt:start,durationMinutes:100,minMinutes:90,maxMinutes:120}).durationMinutes).toBe(100);
 });
 it("denies a smaller program when an active imported enrollment has no term provenance",()=>{
  const source=readFileSync("src/modules/academics/program-service.ts","utf8");
  expect(source).toContain('durationTerms < current.durationTerms');
  expect(source).toContain("durationTerms < Math.max(term?.number ?? 0,progression?.number ?? 0)");
  expect(source).toContain("eq(learnerProgramEnrollments.status,\"ACTIVE\")");
  expect(source).toContain("isNull(cohortProgressionState.cohortId)");
  expect(source).toContain('if(unmappedEnrollment)throw new AcademicsServiceError("PROGRAM_HAS_COHORTS")');
 });
});
