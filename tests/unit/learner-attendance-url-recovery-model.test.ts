import {describe,it,expect} from "vitest";
import {learnerAttendanceUrlRecoveryNotice} from "@/modules/attendance/learner-attendance-url-recovery-model";
const courses=[{deliveryId:"own"}];
const base={deliveryId:null,month:null,status:null,order:null};
describe("learner Attendance URL recovery",()=>{
 it("does not reveal whether an unknown Course belongs to another tenant",()=>{
  const note=learnerAttendanceUrlRecoveryNotice({...base,deliveryId:"foreign"},courses);
  expect(note).toContain("not available");
  expect(note).not.toContain("foreign");
 });
 it("identifies invalid month, status and order while valid filters stay silent",()=>{
  expect(learnerAttendanceUrlRecoveryNotice({...base,month:"2026-13"},courses)).toContain("month");
  expect(learnerAttendanceUrlRecoveryNotice({...base,status:"BOGUS"},courses)).toContain("status");
  expect(learnerAttendanceUrlRecoveryNotice({...base,order:"BOGUS"},courses)).toContain("order");
  expect(learnerAttendanceUrlRecoveryNotice({...base,status:"PRESENT",month:"2026-10"},courses)).toBeNull();
 });
});
