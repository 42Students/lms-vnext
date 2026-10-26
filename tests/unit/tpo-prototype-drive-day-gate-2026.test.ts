import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {buildTpoRoundDriveDayRoster} from "@/modules/placements/tpo-round-drive-day-model";
const source=(path:string)=>readFileSync(path,"utf8");

describe("Original TPO Drive Day · At the gate and in the rooms",()=>{
 it("renders exact five observed attendance states without faking a check-in timestamp",()=>{
  const view=source("src/components/placements/tpo-round-drive-day-read-only.tsx");
  for(const label of ["Here","Not here yet","In interview now","Done","Absent"]){
   expect(view).toContain(label);
  }
  expect(view).toContain("data.counts.present+data.counts.inInterview+data.counts.done");
  expect(view).toContain('data-testid="tpo.drive-day.prototype-summary"');
  expect(view).toContain("data.counts.unknownAttendance>0");
  expect(view).toContain("Arrival timestamps are not recorded by this view");
  expect(view).not.toContain("Harika Devi");
  expect(view).not.toContain("41 here");
 });
 it("has real in-room results and calls next only from a persisted PRESENT room roster",()=>{
  const view=source("src/components/placements/tpo-round-drive-day-read-only.tsx");
  expect(view).toContain('inRoom:roster.filter(row=>row.attendance==="IN_INTERVIEW")');
  expect(view).toContain('next:roster.filter(row=>row.attendance==="PRESENT")');
  expect(view).toContain("queue.inRoom.slice(0,3)");
  expect(view).toContain('aria-label="In the room"');
  expect(view).toContain('aria-label="Next up"');
  expect(view).toContain('<TpoRoundResultRecorder roundId={data.round.id}');
  expect(view).toContain('<TpoRoundCheckIn roundId={data.round.id} applicationId={student.applicationId}');
  expect(view).toContain("expectedAttendance:\"PRESENT\",status:\"IN_INTERVIEW\"");
  const writer=source("src/components/placements/tpo-round-result-recorder.tsx");
  expect(writer).toContain("currentResult()");
  expect(writer).toContain("expectedCurrentResultId: current?.id ?? null");
  expect(writer).toContain("This is not a final published result");
 });
 it("requires confirmation for individual absent actions; never has clock-triggered absent mass mutation",()=>{
  const view=source("src/components/placements/tpo-round-drive-day-read-only.tsx");
  expect(view).toContain('aria-label="Not here yet"');
  expect(view).toContain('data.rows.filter(row=>row.attendance==="WAITING").slice(0,8)');
  expect(view).toContain("No one is automatically marked absent at a fixed clock time.");
  expect(view).toContain("Absent notifications are only confirmed");
  const checkIn=source("src/components/placements/tpo-round-check-in.tsx");
  expect(checkIn).toContain("expectedAttendance: attendance, status");
  expect(checkIn).toContain('setTarget("ABSENT")');
  expect(checkIn).toContain("notificationDelivered");
  expect(checkIn).toContain('<ConfirmDialog open={target !== null}');
 });
 it("uses a scoped persisted five-state roster and excludes duplicate or ambiguous records",()=>{
  const students=[
   {applicationId:"1",displayName:"Present",rollNumber:"R1",attendance:"PRESENT"},
   {applicationId:"2",displayName:"Inside",rollNumber:"R2",attendance:"IN_INTERVIEW"},
   {applicationId:"3",displayName:"Completed",rollNumber:"R3",attendance:"DONE"},
   {applicationId:"4",displayName:"Waiting",rollNumber:"R4",attendance:"WAITING"},
   {applicationId:"5",displayName:"Unknown",rollNumber:"R5",attendance:"OTHER"},
  ];
  const details=students.map(s=>({applicationId:s.applicationId,applicationStatus:"SUBMITTED",
   resultStatus:null,resultOutcome:null}));
  const projected=buildTpoRoundDriveDayRoster(students,details);
  expect(projected.counts).toMatchObject({total:5,present:1,inInterview:1,done:1,waiting:1,
   unknownAttendance:1,absent:0});
  expect(projected.rows.find(x=>x.applicationId==="5")?.attendance).toBe("UNKNOWN");
  const duplicates=buildTpoRoundDriveDayRoster(students,[...details,details[0]!]);
  expect(duplicates.rows.some(row=>row.applicationId==="1")).toBe(false);
 });
});
