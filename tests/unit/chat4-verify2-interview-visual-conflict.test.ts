import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {driveInterviewsParams,sortDriveAppointments} from "@/modules/placements/college-drive-interviews-model";
import {visibleInterviewConflictKinds,visibleInterviewConflictLabel,
 type VisibleInterviewAppointment} from "@/modules/placements/interview-visual-conflict-model";

const base:VisibleInterviewAppointment={
 id:"a",applicationId:"learner-a",status:"SCHEDULED",
 scheduledAt:"2026-10-29T09:00:00.000Z",durationMinutes:60,
 interviewer:"Ms Rao",venue:"Lab 2",meetingUrl:null,
};
describe("W1-2 old LMS interview calendar warning parity",()=>{
 it("shows typed candidate/interviewer/room conflicts with 15-minute buffer",()=>{
  const other={...base,id:"b",scheduledAt:"2026-10-29T10:10:00.000Z"};
  const result=visibleInterviewConflictKinds(base,[base,other]);
  expect(result).toEqual(["Candidate","Interviewer","Room"]);
  expect(visibleInterviewConflictLabel(result)).toBe("Candidate & Interviewer & Room conflict");
 });
 it("does not warn about cancelled, completed, or no-show appointments",()=>{
  for(const status of ["CANCELLED","COMPLETED","NO_SHOW"]){
   expect(visibleInterviewConflictKinds({...base,status},[
    {...base,id:"c"},base])).toEqual([]);
   expect(visibleInterviewConflictKinds(base,[{...base,id:"d",status}])).toEqual([]);
  }
 });
 it("does not flag unrelated or buffer-separated candidates",()=>{
  const unrelated={...base,id:"e",applicationId:"learner-b",interviewer:"Mr Shah",
   venue:"Lab 3",scheduledAt:"2026-10-29T09:20:00.000Z"};
  expect(visibleInterviewConflictKinds(base,[unrelated])).toEqual([]);
  expect(visibleInterviewConflictKinds(base,[{...base,id:"f",
   scheduledAt:"2026-10-29T10:15:00.000Z"}])).toEqual([]);
 });
 it("preserves all four legacy interview sort choices without changing the default",()=>{
  expect(driveInterviewsParams({})?.appointmentSort).toBe("DATE_ASC");
  for(const option of ["DATE_ASC","DATE_DESC","JOB","STATUS"]){
   expect(driveInterviewsParams({appointmentSort:option})?.appointmentSort).toBe(option);
  }
  const rows=[
   {id:"2",scheduledAt:"2026-10-24T09:00:00.000Z",status:"SCHEDULED",jobTitle:"Alpha"},
   {id:"1",scheduledAt:"2026-10-22T09:00:00.000Z",status:"CANCELLED",jobTitle:"Zeta"},
   {id:"3",scheduledAt:"2026-10-23T09:00:00.000Z",status:"SCHEDULED",jobTitle:"Zeta"},
  ];
  expect(sortDriveAppointments(rows,"DATE_ASC").map(row=>row.id)).toEqual(["1","3","2"]);
  expect(sortDriveAppointments(rows,"DATE_DESC").map(row=>row.id)).toEqual(["2","3","1"]);
  expect(sortDriveAppointments(rows,"JOB").map(row=>row.id)).toEqual(["2","1","3"]);
  expect(sortDriveAppointments(rows,"STATUS").map(row=>row.id)).toEqual(["1","3","2"]);
  expect(rows[0]?.id).toBe("2"); // sort cannot mutate the read cache
 });
 it("renders a visible, typed red warning icon in candidate rows and table",()=>{
  const source=readFileSync("src/components/placements/college-interview-appointments.tsx","utf8");
  expect(source).toContain('visibleInterviewConflictLabel(kinds)');
  expect(source).toContain('aria-hidden="true" width="13" height="13"');
  expect(source).toContain('<StatusBadge tone="error">');
  expect(source).toContain('cell:row=>conflictBadge(row)??"—"');
 });
});
