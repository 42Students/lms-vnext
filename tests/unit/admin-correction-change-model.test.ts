import {describe,expect,it} from "vitest";
import {adminAttendanceCorrectionChange,adminAttendanceRecordTokenMatches,adminAttendanceAuditEventType} from "@/modules/attendance/admin-correction-change-model";

describe("DB06 admin attendance correction change detection",()=>{
  it("does not rewrite unchanged implicit PRESENT or notify a guardian",()=>{
    expect(adminAttendanceCorrectionChange({
      previous:null,requestedStatus:"PRESENT",requestedNote:undefined,
    })).toMatchObject({
      changed:false,mustCreateRecord:false,
      shouldNotifyAbsent:false,shouldNotifyCorrected:false,
    });
  });

  it("records explicit PRESENT with a review note without marking the session",()=>{
    expect(adminAttendanceCorrectionChange({
      previous:null,requestedStatus:"PRESENT",requestedNote:"Reviewed",
    })).toMatchObject({
      changed:true,mustCreateRecord:true,nextNote:"Reviewed",
      shouldNotifyAbsent:false,shouldNotifyCorrected:false,
    });
  });

  it("persists note-only correction but does not send duplicate ABSENT SMS",()=>{
    expect(adminAttendanceCorrectionChange({
      previous:{status:"ABSENT",note:"Original"},requestedStatus:"ABSENT",
      requestedNote:"Corrected explanation",
    })).toMatchObject({
      statusChanged:false,noteChanged:true,changed:true,
      mustCreateRecord:false,shouldNotifyAbsent:false,shouldNotifyCorrected:false,
    });
  });

  it("distinguishes omitted note from clearing a note",()=>{
    const previous={status:"MEDICAL",note:"Doctor requested rest"};
    expect(adminAttendanceCorrectionChange({
      previous,requestedStatus:"MEDICAL",requestedNote:undefined,
    })).toMatchObject({changed:false,nextNote:"Doctor requested rest"});
    expect(adminAttendanceCorrectionChange({
      previous,requestedStatus:"MEDICAL",requestedNote:" ",
    })).toMatchObject({changed:true,nextNote:null,shouldNotifyAbsent:false});
  });

  it("notifies guardian only for an actual absence or ABSENT-to-PRESENT change",()=>{
    expect(adminAttendanceCorrectionChange({
      previous:{status:"PRESENT",note:null},requestedStatus:"ABSENT",
      requestedNote:undefined,
    })).toMatchObject({shouldNotifyAbsent:true,shouldNotifyCorrected:false});
    expect(adminAttendanceCorrectionChange({
      previous:{status:"ABSENT",note:null},requestedStatus:"PRESENT",
      requestedNote:undefined,
    })).toMatchObject({shouldNotifyAbsent:false,shouldNotifyCorrected:true});
    expect(adminAttendanceCorrectionChange({
      previous:{status:"ABSENT",note:null},requestedStatus:"LATE",
      requestedNote:undefined,
    })).toMatchObject({shouldNotifyAbsent:false,shouldNotifyCorrected:false});
  });
});

describe("DB06 admin reviewed-record CAS token",()=>{
  it("uses exact instants rather than timezone formatting",()=>{
    const current=new Date("2026-10-29T06:30:00.000Z");
    expect(adminAttendanceRecordTokenMatches(
      "2026-10-29T12:00:00.000+05:30",current,
    )).toBe(true);
    expect(adminAttendanceRecordTokenMatches(
      "2026-10-29T06:30:00.001Z",current,
    )).toBe(false);
    expect(adminAttendanceRecordTokenMatches("not-a-date",current)).toBe(false);
  });
  it("requires null only for a genuinely uncreated record",()=>{
    const current=new Date("2026-10-29T06:30:00.000Z");
    expect(adminAttendanceRecordTokenMatches(null,null)).toBe(true);
    expect(adminAttendanceRecordTokenMatches(null,current)).toBe(false);
    expect(adminAttendanceRecordTokenMatches("2026-10-29T06:30:00Z",null)).toBe(false);
    expect(adminAttendanceRecordTokenMatches(undefined,current)).toBe(true);
  });
});

describe("DB06 admin attendance audit attribution",()=>{
 it("records note-only edits without claiming a new absence",()=>{
  for(const status of ["PRESENT","ABSENT","EXCUSED","MEDICAL","LATE"]){
   expect(adminAttendanceAuditEventType(false,status)).toBe("ADMIN_ATTENDANCE_NOTE_UPDATED");
  }
 });
 it("retains legacy status transition aliases for existing audit consumers",()=>{
  expect(adminAttendanceAuditEventType(true,"PRESENT")).toBe("ADMIN_ATTENDANCE_MARK_PRESENT");
  for(const status of ["ABSENT","EXCUSED","MEDICAL","LATE"]){
   expect(adminAttendanceAuditEventType(true,status)).toBe("ADMIN_ATTENDANCE_MARK_ABSENT");
  }
 });
});
