/**
 * Legacy attendance controller/TakeAttendance crosswalk for the new scoped
 * faculty and College Admin attendance workspaces. No new parallel attendance
 * table, numeric-ID lookup or administrator bypass is introduced.
 *
 * Legacy teacher monthly → /teacher/courses and /teacher/attendance,
 * POST bulk mark → PATCH /api/attendance/faculty/sessions/{scheduleEventId};
 * Legacy admin mark-present/mark-absent →
 * PATCH /api/attendance/admin/sessions/{scheduleEventId}.
 * Legacy learner read → /learn/attendance and delivery-scoped course pages.
 *
 * API callers must first obtain a member + scheduleEvent UUID from the
 * authorized roster. Numeric learner/class IDs are historical identifiers,
 * not sufficient authorization to mark attendance.
 */
export const LEGACY_ATTENDANCE_BULK_LIMIT = 500;
export const LEGACY_ATTENDANCE_NOTE_MAX_LENGTH = 1000;

export type LegacyAttendanceStatus = "PRESENT"|"ABSENT"|"EXCUSED"|"MEDICAL"|"LATE";
export type LegacyAttendanceSessionStatus = LegacyAttendanceStatus|"NOT_MARKED"|"SCHEDULED";

export function legacyAttendanceStatus(raw:unknown):LegacyAttendanceStatus|null {
 if(raw==null || (typeof raw==="string"&&raw.trim()===""))return "ABSENT";
 if(typeof raw!=="string")return null;
 const normalized=raw.trim().toUpperCase();
 switch(normalized){
  case "PRESENT":case "ABSENT":case "EXCUSED":case "MEDICAL":case "LATE":
   return normalized;
  default:return null;
 }
}

/** Historical nullable status represents an absence only when it came from
 * a persisted absence record. A missing record/session is NOT_MARKED until
 * an authorized faculty member completes attendance for the schedule event.
 */
export function importedLegacyAttendanceStatus(input:{
 recordExists:boolean;sessionMarked:boolean;status:unknown;startsAt?:string;now?:number;
}):LegacyAttendanceSessionStatus {
 if(!input.sessionMarked)return input.startsAt&&Date.parse(input.startsAt)>(input.now??Date.now())?
  "SCHEDULED":"NOT_MARKED";
 if(!input.recordExists)return "PRESENT";
 return legacyAttendanceStatus(input.status)??"NOT_MARKED";
}

export function legacyAttendanceReason(raw:unknown):{ok:true;note:string|null}|{
 ok:false;message:string
}{
 if(raw==null || raw==="")return {ok:true,note:null};
 if(typeof raw!=="string")return {ok:false,message:"Give a valid reason for this attendance correction."};
 const note=raw.trim();
 if(note.length>LEGACY_ATTENDANCE_NOTE_MAX_LENGTH)
  return {ok:false,message:"Reason must be 1,000 characters or fewer. Shorten it before saving."};
 return {ok:true,note:note||null};
}

/** Old AttendanceDTO required studentId and positive classScheduleId. New
 * sessions are UUID scoped. Return a direct actionable error when the old
 * numeric class/learner IDs cannot be mapped by the authorized service.
 */
export function legacyAdminAttendanceCorrection(input:{
 membershipId:unknown;scheduleEventId:unknown;status?:unknown;reason?:unknown;
}):{ok:true;body:{membershipId:string;status:LegacyAttendanceStatus;note:string|null}}|
 {ok:false;message:string}{
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(typeof input.membershipId!=="string"||!uuid.test(input.membershipId))
  return {ok:false,message:"Student ID is required. Choose a student from the current roster."};
 if(typeof input.scheduleEventId!=="string"||!uuid.test(input.scheduleEventId))
  return {ok:false,message:"Class schedule is required. Select a class session."};
 const status=legacyAttendanceStatus(input.status);
 if(!status)return {ok:false,message:"Choose Present, Absent, Excused, Medical or Late."};
 const note=legacyAttendanceReason(input.reason);
 if(!note.ok)return note;
 return {ok:true,body:{membershipId:input.membershipId,status,note:note.note}};
}

export function legacyFacultyBulkAttendance(input:{
 presentMembershipIds:readonly string[];absentMembershipIds:readonly string[];
}):{ok:true;presentMembershipIds:string[];absentMembershipIds:string[]}|
 {ok:false;message:string}{
 const ids=[...input.presentMembershipIds,...input.absentMembershipIds];
 if(ids.length>LEGACY_ATTENDANCE_BULK_LIMIT)
  return {ok:false,message:"You can mark up to 500 students at a time."};
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(ids.some(id=>typeof id!=="string"||!uuid.test(id)))
  return {ok:false,message:"Choose students from the authorized class roster."};
 if(new Set(ids).size!==ids.length)
  return {ok:false,message:"A student can be marked only once per session."};
 return {ok:true,
  presentMembershipIds:[...input.presentMembershipIds],
  absentMembershipIds:[...input.absentMembershipIds]};
}

export function legacyTakeAttendanceHeadings():readonly ["Student Name","Status"]{
 return ["Student Name","Status"];
}

export function legacyAttendanceRecordDescription(status:LegacyAttendanceSessionStatus,
 hasRecord:boolean):string{
 if(status==="NOT_MARKED")return "Attendance not yet taken for this session";
 if(status==="ABSENT"&&!hasRecord)return "No absence recorded";
 return "Attendance record";
}

/** After a correction, the faculty or admin writer logs COURSES_ATTENDANCE_MARKED
 * and attaches the old ATTENDANCE_MARK_BULK action alias to the audit read
 * model. This metadata helper never sends an SMS by itself.
 */
export function legacyAttendanceAuditAlias(input:{
 count:number;changed:number;action:"BULK"|"CORRECT";
}){
 return {action:input.action==="BULK"?"ATTENDANCE_MARK_BULK":"ATTENDANCE_CORRECT",
  totalStudents:Math.max(0,Math.floor(input.count)),
  changedStudents:Math.max(0,Math.floor(input.changed))};
}

export function legacyAttendanceUnavailableMessage(code:string):string{
 return code==="DATABASE_UNAVAILABLE"||code==="ATTENDANCE_DATA_UNAVAILABLE"?
  "Attendance data is temporarily unavailable":
  "Couldn't load attendance. Retry this session.";
}

export function legacyAttendanceFacultyDeepLink(deliveryId:string,scheduleEventId:string):string|null{
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!uuid.test(deliveryId)||!uuid.test(scheduleEventId))return null;
 return "/teacher/attendance?deliveryId="+encodeURIComponent(deliveryId)+
  "&scheduleEventId="+encodeURIComponent(scheduleEventId);
}

/** Legacy Download PDF is a distinct reviewed export; do not label the
 * current CSV export as PDF or expose a private roster through a public URL.
 */
export const LEGACY_ATTENDANCE_REPORT_FORMATS = ["PDF","CSV"] as const;
