/** Source-only attendance schedule crosswalk for legacy integer
 * class_schedule_id -> selected-college sectionScheduleEvent UUID. This is
 * an import PREVIEW, not an authorization mechanism or a database write.
 * Historical all-present sessions must be marked even with zero Attend rows.
 */
export type LegacyAttendanceSchedule={
 legacyClassScheduleId:number;
 collegeId:string;
 legacyClassId:number;
 legacyCourseId:number;
 legacyFacultyId:number|null;
 attendanceMarkedAt:string|null;
};
export type VerifiedAttendanceScheduleCrosswalk={
 legacyClassScheduleId:number;collegeId:string;
 legacyClassId:number;legacyCourseId:number;
 legacyFacultyId:number|null;
 scheduleEventId:string;sectionDeliveryId:string;
 markedByUserId:string|null;
};
export type LegacyAttendanceImportBlocker={
 legacyClassScheduleId:number;reason:
 "INVALID_SOURCE"|"UNMAPPED"|"AMBIGUOUS"|"CROSS_COLLEGE"|
 "ACADEMIC_SCOPE_MISMATCH"|"MISSING_MARKER_ACTOR";
};
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function sourceMarkedAt(value:string):Date|null{
 if(/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d(?::\d\d(?:\.\d{1,6})?)?$/.test(value))
  return new Date(value.replace(" ","T")+"+05:30");
 if(/[zZ]|[+-]\d\d:\d\d$/.test(value))return new Date(value);
 return null;
}
export function planLegacyAttendanceSessionBackfill(
 rows:readonly LegacyAttendanceSchedule[],
 verified:readonly VerifiedAttendanceScheduleCrosswalk[],
){
 const errors:LegacyAttendanceImportBlocker[]=[];
 const sessions:Array<{
  scheduleEventId:string;legacyClassScheduleId:number;
  legacyClassId:number;legacyCourseId:number;legacyFacultyId:number|null;
  status:"MARKED"|"UNMARKED";markedByUserId:string|null;
  markedAt:Date|null;legacyAttendanceMarkedAt:Date|null;
  sectionDeliveryId:string;
 }>=[];
 const eventIds=new Set<string>(),sourceIds=new Set<string>();
 for(const row of rows){
  const key=row.collegeId+":"+row.legacyClassScheduleId;
  if(!Number.isSafeInteger(row.legacyClassScheduleId)||row.legacyClassScheduleId<=0||
     !uuidPattern.test(row.collegeId)||sourceIds.has(key)){
   errors.push({legacyClassScheduleId:row.legacyClassScheduleId,reason:"INVALID_SOURCE"});continue;
  }
  sourceIds.add(key);
  const candidates=verified.filter(item=>item.legacyClassScheduleId===row.legacyClassScheduleId);
  const scoped=candidates.filter(item=>item.collegeId===row.collegeId);
  if(!scoped.length){
   errors.push({legacyClassScheduleId:row.legacyClassScheduleId,
    reason:candidates.length?"CROSS_COLLEGE":"UNMAPPED"});continue;
  }
  if(scoped.length!==1){
   errors.push({legacyClassScheduleId:row.legacyClassScheduleId,reason:"AMBIGUOUS"});continue;
  }
  const mapped=scoped[0]!;
  if(mapped.legacyClassId!==row.legacyClassId||
     mapped.legacyCourseId!==row.legacyCourseId||
     mapped.legacyFacultyId!==row.legacyFacultyId||
     !uuidPattern.test(mapped.scheduleEventId)||
     !uuidPattern.test(mapped.sectionDeliveryId)||
     eventIds.has(mapped.scheduleEventId)){
   errors.push({legacyClassScheduleId:row.legacyClassScheduleId,
    reason:"ACADEMIC_SCOPE_MISMATCH"});continue;
  }
  const marked=row.attendanceMarkedAt!==null;
  const timestamp=marked?sourceMarkedAt(row.attendanceMarkedAt!):null;
  if(marked&&(!timestamp||!Number.isFinite(timestamp.getTime())||
     !mapped.markedByUserId||!uuidPattern.test(mapped.markedByUserId))){
   errors.push({legacyClassScheduleId:row.legacyClassScheduleId,
    reason:"MISSING_MARKER_ACTOR"});continue;
  }
  eventIds.add(mapped.scheduleEventId);
  sessions.push({
   scheduleEventId:mapped.scheduleEventId,
   sectionDeliveryId:mapped.sectionDeliveryId,
   legacyClassScheduleId:row.legacyClassScheduleId,
   legacyClassId:row.legacyClassId,
   legacyCourseId:row.legacyCourseId,
   legacyFacultyId:row.legacyFacultyId,
   status:marked?"MARKED":"UNMARKED",
   markedByUserId:marked?mapped.markedByUserId:null,
   markedAt:timestamp,legacyAttendanceMarkedAt:timestamp,
  });
 }
 return {sessions,errors,readyToPersist:errors.length===0&&sessions.length===rows.length};
}
