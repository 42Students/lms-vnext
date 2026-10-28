import {describe,expect,it} from "vitest";
import {facultyCorrectionDelta,facultyCorrectionReasonValid,
 facultyAttendanceConfirmation,facultyAttendanceChangedMemberships}
 from "@/modules/attendance/faculty-correction-audit-model";
import {facultyAttendanceCorrectionTokenMatches,facultyAttendanceNextMarkedAt}
 from "@/modules/attendance/faculty-correction-token-model";
import {initialAbsencesForSession,resolveFacultyAttendanceSession,
 resolveFacultyAttendanceDeepLink,facultyAttendanceMarksDirty}
 from "@/modules/attendance/faculty-attendance-edit-state";
import {facultyAttendanceMarkingWindow} from "@/modules/attendance/faculty-marking-window";
import {indiaAttendanceDayKey,indiaAttendanceMonthKey,shiftIndiaAttendanceMonth,
 groupFacultyAttendanceSessionsByIndiaDay,facultyAttendanceDayCell}
 from "@/modules/attendance/faculty-grid-model";

const learnerA="11111111-1111-4111-8111-111111111111";
const learnerB="22222222-2222-4222-8222-222222222222";
const outside="33333333-3333-4333-8333-333333333333";
const session="44444444-4444-4444-8444-444444444444";
const otherSession="55555555-5555-4555-8555-555555555555";
const roster=[{membershipId:learnerA},{membershipId:learnerB}];
const now=new Date("2026-10-18T10:00:00.000Z");
describe("COURSES-BREAK-FACULTY-07 attendance role, stale edit and India time",()=>{
 it("FAC-attendance-grades-02 deep-link may open Mark mode only for the current Section event",()=>{
  const sessions=[{id:session},{id:otherSession}];
  expect(resolveFacultyAttendanceDeepLink(sessions,session)).toBe(session);
  expect(resolveFacultyAttendanceDeepLink(sessions,outside)).toBeNull();
  expect(resolveFacultyAttendanceDeepLink(sessions,["a","b"])).toBeNull();
  expect(resolveFacultyAttendanceSession(sessions,outside)).toBe(session);
  expect(resolveFacultyAttendanceSession([],outside)).toBe("");
 });
 it("FAC-attendance-grades-02 a previous Section session cannot mark foreign or unrelated absent learners",()=>{
  const prior=initialAbsencesForSession(roster,[
   {scheduleEventId:session,membershipId:learnerA,status:"ABSENT"},
   {scheduleEventId:session,membershipId:outside,status:"ABSENT"},
   {scheduleEventId:otherSession,membershipId:learnerB,status:"ABSENT"},
  ],session);
  expect([...prior]).toEqual([learnerA]);
  expect(facultyAttendanceMarksDirty(roster,prior,new Set([learnerA]))).toBe(false);
  expect(facultyAttendanceMarksDirty(roster,prior,new Set([learnerB]))).toBe(true);
  expect(facultyAttendanceMarksDirty(roster,prior,new Set([learnerA,outside]))).toBe(false);
 });
 it("FAC-attendance-grades-02 correcting an unmodified roster is no-op and never notifies everyone",()=>{
  expect(facultyCorrectionDelta([learnerA],[learnerA])).toMatchObject({changed:false});
  expect(facultyAttendanceConfirmation(true,[learnerA],[learnerA],2)).toBeNull();
  expect(facultyAttendanceChangedMemberships([learnerA],[learnerA]))
   .toEqual({newlyAbsent:[],correctedPresent:[]});
  expect(facultyAttendanceChangedMemberships([learnerA],[learnerB]))
   .toEqual({newlyAbsent:[learnerB],correctedPresent:[learnerA]});
  expect(facultyCorrectionDelta([learnerA],[learnerB])).toEqual({
   movedToAbsent:1,movedToPresent:1,changed:true,
  });
 });
 it("FAC-attendance-grades-02 rejects absent counts beyond the roster and short correction reasons",()=>{
  expect(facultyAttendanceConfirmation(false,[learnerA],[learnerA,learnerB,outside],2)).toBeNull();
  expect(facultyAttendanceConfirmation(false,[],[learnerA],0)).toBeNull();
  expect(facultyAttendanceConfirmation(false,[],[learnerA],2)).toContain("1 student(s) absent");
  expect(facultyAttendanceConfirmation(true,[learnerA],[learnerB],2))
   .toContain("1 changed to absent, 1 changed to present");
  for(const input of [null,undefined,"short"," ".repeat(20),"x".repeat(501)])
   expect(facultyCorrectionReasonValid(input)).toBe(false);
  expect(facultyCorrectionReasonValid("Marked against the wrong attendance row")).toBe(true);
 });
 it("FAC-attendance-grades-02 stale attendance marks are denied and monotonic tokens beat clock skew",()=>{
  const last=new Date("2026-10-18T10:00:00.123Z");
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",last,last.toISOString())).toBe(true);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",last,
   "2026-10-18T10:00:00.122Z")).toBe(false);
  expect(facultyAttendanceCorrectionTokenMatches("MARKED",last,undefined)).toBe(false);
  expect(facultyAttendanceCorrectionTokenMatches("NOT_MARKED",null,undefined)).toBe(true);
  expect(facultyAttendanceCorrectionTokenMatches("NOT_MARKED",null,last.toISOString())).toBe(false);
  expect(facultyAttendanceNextMarkedAt(now,last).getTime()).toBe(last.getTime()+1);
 });
 it("FAC-attendance-grades-02 wall-clock limits use server instants including exact start and expiry",()=>{
  const startsAt=new Date("2026-10-18T09:00:00.000Z");
  const endsAt=new Date("2026-10-18T10:00:00.000Z");
  const window=(time:string,hours=1)=>facultyAttendanceMarkingWindow({
   startsAt,endsAt,correctionWindowHours:hours,now:new Date(time),
  });
  expect(window("2026-10-18T08:59:59.999Z")).toBe("NOT_STARTED");
  expect(window("2026-10-18T09:00:00.000Z")).toBe("OPEN");
  expect(window("2026-10-18T11:00:00.000Z")).toBe("OPEN");
  expect(window("2026-10-18T11:00:00.001Z")).toBe("WINDOW_EXPIRED");
  expect(window("2026-10-18T10:00:00.001Z",0)).toBe("WINDOW_EXPIRED");
  expect(window("2026-10-18T09:30:00.000Z",-1)).toBe("WINDOW_EXPIRED");
 });
 it("FAC-attendance-grades-02 displayed India days do not shift with browser timezone",()=>{
  expect(indiaAttendanceDayKey("2026-10-18T18:29:59.999Z")).toBe("2026-10-18");
  expect(indiaAttendanceDayKey("2026-10-18T18:30:00.000Z")).toBe("2026-10-19");
  expect(indiaAttendanceMonthKey("2026-10-31T18:30:00.000Z")).toBe("2026-11");
  expect(shiftIndiaAttendanceMonth("2026-12",1)).toBe("2027-01");
  expect(shiftIndiaAttendanceMonth("2026-01",-1)).toBe("2025-12");
  expect(shiftIndiaAttendanceMonth("bad",1)).toBe("bad");
 });
 it("FAC-attendance-grades-02 grouping and day cells include only current session states",()=>{
  const earlier={id:session,startsAt:"2026-10-18T09:00:00.000Z",attendanceStatus:"MARKED"};
  const later={id:otherSession,startsAt:"2026-10-18T10:00:00.000Z",attendanceStatus:null};
  const groups=groupFacultyAttendanceSessionsByIndiaDay([later,earlier]);
  expect(groups).toHaveLength(1);
  expect(groups[0]?.sessions.map(x=>x.id)).toEqual([session,otherSession]);
  const cell=facultyAttendanceDayCell([earlier,later],new Map([[
   session,{scheduleEventId:session,membershipId:learnerA,status:"ABSENT"},
  ]]),new Date("2026-10-18T12:00:00.000Z"));
  expect(cell).toMatchObject({code:"MIXED",absent:1,present:0,notMarked:1,scheduled:0});
 });
});
