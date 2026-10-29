import {describe,expect,it} from "vitest";
import {adminAttendanceCorrectionChange} from "@/modules/attendance/admin-correction-change-model";

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
