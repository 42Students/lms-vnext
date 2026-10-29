import {describe,expect,it} from "vitest";
import {buildAttendanceHistoryEvent,type AttendanceHistorySnapshot}
  from "@/modules/attendance/db06-attendance-history-staged";

const markedAt=new Date("2026-10-29T05:00:00.000Z");
const changedAt=new Date("2026-10-29T05:01:00.000Z");
const before:AttendanceHistorySnapshot={
  id:"record-a",scheduleEventId:"event-a",membershipId:"learner-a",
  status:"ABSENT",note:"Initial absence",markedByUserId:"faculty-a",
  markedAt,version:0,
};
const actor={
  actorUserId:"admin-a",actorMembershipId:"admin-membership-a" as string|null,
  actorRole:"COLLEGE_ADMIN" as const,deliveryId:"delivery-a",collegeId:"college-a",
  occurredAt:changedAt,
};
const correction={...before,status:"PRESENT" as const,note:"Reviewed correction",
  markedByUserId:"admin-a",markedAt:changedAt,version:1};

describe("DB035 immutable attendance history payload (staging only)",()=>{
  it("creates MARK version 0 with an explicit PRESENT record",()=>{
    const initial={...before,status:"PRESENT" as const,note:null,version:0,
      markedByUserId:"admin-a"};
    const event=buildAttendanceHistoryEvent({...actor,before:null,after:initial});
    expect(event).toMatchObject({
      attendanceRecordId:"record-a",action:"MARK",newStatus:"PRESENT",
      previousStatus:null,recordVersionBefore:null,recordVersionAfter:0,
      actorRole:"COLLEGE_ADMIN",newMarkedByUserId:"admin-a",
    });
  });
  it("creates CORRECT version 1 against the same retained row ID",()=>{
    const event=buildAttendanceHistoryEvent({...actor,before,after:correction});
    expect(event).toMatchObject({
      attendanceRecordId:"record-a",action:"CORRECT",
      previousStatus:"ABSENT",newStatus:"PRESENT",recordVersionBefore:0,
      recordVersionAfter:1,previousMarkedByUserId:"faculty-a",
      newMarkedByUserId:"admin-a",previousMarkedAt:markedAt,
      newMarkedAt:changedAt,
    });
  });
  it("rejects direct SQL-like parent swapping or skipped optimistic version",()=>{
    expect(()=>buildAttendanceHistoryEvent({...actor,before,
      after:{...correction,id:"record-other"}}))
      .toThrow("ATTENDANCE_HISTORY_PARENT_IDENTITY_CHANGED");
    expect(()=>buildAttendanceHistoryEvent({...actor,before,
      after:{...correction,version:3}}))
      .toThrow("ATTENDANCE_HISTORY_NON_SEQUENTIAL_VERSION");
    expect(()=>buildAttendanceHistoryEvent({...actor,before:null,
      after:{...correction,version:1}}))
      .toThrow("ATTENDANCE_HISTORY_INITIAL_VERSION_NOT_ZERO");
  });
  it("rejects spoofed actor, invalid actor shape and no-op correction",()=>{
    expect(()=>buildAttendanceHistoryEvent({...actor,before,
      after:{...correction,markedByUserId:"other-user"}}))
      .toThrow("ATTENDANCE_HISTORY_MARKER_ACTOR_MISMATCH");
    expect(()=>buildAttendanceHistoryEvent({...actor,actorMembershipId:null,
      before,after:correction}))
      .toThrow("ATTENDANCE_HISTORY_ACTOR_MEMBERSHIP_MISMATCH");
    expect(()=>buildAttendanceHistoryEvent({...actor,actorRole:"SUPER_ADMIN",
      actorMembershipId:null,before,after:correction}))
      .not.toThrow();
    expect(()=>buildAttendanceHistoryEvent({...actor,before,
      after:{...before,version:1,markedByUserId:"admin-a"}}))
      .not.toThrow();
    expect(()=>buildAttendanceHistoryEvent({
      ...actor,actorUserId:"faculty-a",before,
      after:{...before,version:1},
    })).toThrow("ATTENDANCE_HISTORY_NO_CHANGE");
  });
});
