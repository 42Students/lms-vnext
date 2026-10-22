import {describe,expect,it} from "vitest";
import {planLegacyAttendanceSessionBackfill,type LegacyAttendanceSchedule,
 type VerifiedAttendanceScheduleCrosswalk}
 from "@/modules/attendance/legacy-session-import-model";
const COLLEGE="11111111-1111-4111-8111-111111111111";
const EVENT="22222222-2222-4222-8222-222222222222";
const DELIVERY="33333333-3333-4333-8333-333333333333";
const ACTOR="44444444-4444-4444-8444-444444444444";
const source:LegacyAttendanceSchedule={
 legacyClassScheduleId:123,collegeId:COLLEGE,legacyClassId:11,
 legacyCourseId:22,legacyFacultyId:33,attendanceMarkedAt:"2025-03-05 10:30:00",
};
const mapped:VerifiedAttendanceScheduleCrosswalk={
 legacyClassScheduleId:123,collegeId:COLLEGE,legacyClassId:11,legacyCourseId:22,
 legacyFacultyId:33,scheduleEventId:EVENT,sectionDeliveryId:DELIVERY,markedByUserId:ACTOR,
};
describe("legacy integer attendance class schedule import",()=>{
 it("preserves marked sessions even if there are no absence rows",()=>{
  const plan=planLegacyAttendanceSessionBackfill([source],[mapped]);
  expect(plan.readyToPersist).toBe(true);
  expect(plan.sessions).toHaveLength(1);
  expect(plan.sessions[0].status).toBe("MARKED");
  expect(plan.sessions[0].legacyClassScheduleId).toBe(123);
  expect(plan.sessions[0].markedAt?.toISOString()).toBe("2025-03-05T05:00:00.000Z");
  expect(plan.sessions[0].markedByUserId).toBe(ACTOR);
 });
 it("preserves untouched sessions as UNMARKED without inventing an actor",()=>{
  const plan=planLegacyAttendanceSessionBackfill([{...source,attendanceMarkedAt:null}],[
   {...mapped,markedByUserId:null},
  ]);
  expect(plan.sessions[0].status).toBe("UNMARKED");
  expect(plan.sessions[0].markedAt).toBeNull();
  expect(plan.sessions[0].markedByUserId).toBeNull();
 });
 it("fails closed for foreign colleges, wrong course, ambiguous mapping and unknown markers",()=>{
  const foreign=planLegacyAttendanceSessionBackfill([source],[
   {...mapped,collegeId:"55555555-5555-4555-8555-555555555555"},
  ]);
  expect(foreign.errors[0].reason).toBe("CROSS_COLLEGE");
  const course=planLegacyAttendanceSessionBackfill([source],[{...mapped,legacyCourseId:999}]);
  expect(course.errors[0].reason).toBe("ACADEMIC_SCOPE_MISMATCH");
  const amb=planLegacyAttendanceSessionBackfill([source],[mapped,mapped]);
  expect(amb.errors[0].reason).toBe("AMBIGUOUS");
  const actor=planLegacyAttendanceSessionBackfill([source],[{...mapped,markedByUserId:null}]);
  expect(actor.errors[0].reason).toBe("MISSING_MARKER_ACTOR");
 });
});
