import {describe,it,expect} from "vitest";
import {facultyAssignmentCommandSchema,assignmentFieldsChanged,facultyAssignmentMethodsChanged,
 facultyAssignmentVersionMatches,facultyAssignmentEditLockedBySubmissions} from "@/modules/courses/faculty-assignment-authoring-model";
import {facultyAssignmentGradingAllowed,facultyAssignmentGradePublicationAllowed} from "@/modules/courses/faculty-assignment-grading-policy";
import {facultyGradeHasChanges} from "@/modules/courses/faculty-grade-noop-model";
import {facultyLiveMutationSchema,facultyLiveWindow} from "@/modules/courses/faculty-live-mutation-model";
import {facultyLiveDeliveryLockKey} from "@/modules/courses/faculty-live-lock-model";
import {mapFacultyScheduleInsertError} from "@/modules/attendance/faculty-schedule-errors";
import {CoursesServiceError} from "@/modules/courses/errors";
const id="11111111-1111-4111-8111-111111111111";
const future="2099-01-01T10:00:00.000Z",end="2099-01-01T11:00:00.000Z";
describe("FAC assignment, live class, grades: mutation and privacy rules",()=>{
 it("FAC-AUTH-01 create/update requires confirmed command, bounded points and exact expected timestamp",()=>{
  const input={action:"CREATE",title:"Homework",description:null,dueAt:null,maxPoints:100,lessonId:id,sequence:0,confirmed:true};
  expect(facultyAssignmentCommandSchema.safeParse(input).success).toBe(true);
  expect(facultyAssignmentCommandSchema.safeParse({...input,confirmed:false}).success).toBe(false);
  expect(facultyAssignmentCommandSchema.safeParse({...input,maxPoints:1001}).success).toBe(false);
  expect(facultyAssignmentCommandSchema.safeParse({...input,extra:"unsafe"}).success).toBe(false);
  expect(facultyAssignmentCommandSchema.safeParse({action:"EDIT",title:"Homework",description:null,dueAt:null,maxPoints:100,assignmentId:id,expectedUpdatedAt:future,confirmed:true}).success).toBe(true);
  expect(facultyAssignmentCommandSchema.safeParse({...input,action:"PUBLISH",assignmentId:id,expectedUpdatedAt:future}).success).toBe(false);
  expect(facultyAssignmentCommandSchema.safeParse({action:"PUBLISH",assignmentId:id,expectedUpdatedAt:future,confirmed:true}).success).toBe(true);
 });
 it("FAC-AUTH-02 after a learner submits, only assignment title may change",()=>{
  expect(facultyAssignmentEditLockedBySubmissions(["title"],true)).toBe(false);
  expect(facultyAssignmentEditLockedBySubmissions(["description"],true)).toBe(true);
  expect(facultyAssignmentEditLockedBySubmissions(["maxPoints"],true)).toBe(true);
  expect(facultyAssignmentEditLockedBySubmissions(["dueAt"],false)).toBe(false);
 });
 it("FAC-AUTH-03 authoring no-op, methods order and millisecond version are canonical",()=>{
  const current={title:"Homework",description:null,dueAt:null,maxPoints:100};
  expect(assignmentFieldsChanged(current,{...current,dueAt:null})).toEqual([]);
  expect(assignmentFieldsChanged(current,{...current,title:"New"})).toEqual(["title"]);
  expect(facultyAssignmentMethodsChanged(["FILE_UPLOAD","WRITTEN_RESPONSE"],["WRITTEN_RESPONSE","FILE_UPLOAD"])).toBe(false);
  expect(facultyAssignmentMethodsChanged(["WRITTEN_RESPONSE"],["FILE_UPLOAD"])).toBe(true);
  const stamped=new Date("2026-10-18T09:00:00.123Z");
  expect(facultyAssignmentVersionMatches(stamped,stamped.toISOString())).toBe(true);
  expect(facultyAssignmentVersionMatches(stamped,"2026-10-18T09:00:00.124Z")).toBe(false);
 });
 it("FAC-AUTH-04 grading rejects not-published, out-of-bounds and ungraded publish",()=>{
  expect(facultyAssignmentGradingAllowed("PUBLISHED",8,10)).toBe(true);
  expect(facultyAssignmentGradingAllowed("DRAFT",8,10)).toBe(false);
  expect(facultyAssignmentGradingAllowed("PUBLISHED",-1,10)).toBe(false);
  expect(facultyAssignmentGradingAllowed("PUBLISHED",11,10)).toBe(false);
  expect(facultyAssignmentGradingAllowed("PUBLISHED",NaN,10)).toBe(false);
  expect(facultyAssignmentGradePublicationAllowed("PUBLISHED","GRADED")).toBe(true);
  expect(facultyAssignmentGradePublicationAllowed("PUBLISHED","PENDING")).toBe(false);
  expect(facultyGradeHasChanges({gradingStatus:"GRADED",pointsAwarded:8,feedback:"great"},{pointsAwarded:8,feedback:" great "})).toBe(false);
  expect(facultyGradeHasChanges({gradingStatus:"DRAFT",pointsAwarded:null,feedback:null},{pointsAwarded:0})).toBe(true);
 });
 it("FAC-LIVE-01 accepts only confirmed future, HTTPS whitelisted meeting hosts",()=>{
  const input={action:"CREATE",confirm:true,lessonId:id,title:"Live lecture",meetingUrl:"https://meet.google.com/abc-defg-hij",startsAt:future,endsAt:end};
  expect(facultyLiveMutationSchema.safeParse(input).success).toBe(true);
  for(const url of ["http://meet.google.com/path","https://zoom.us.evil.com/j/123","https://evil.com","https://username:password@zoom.us/j/1"])
   expect(facultyLiveMutationSchema.safeParse({...input,meetingUrl:url}).success).toBe(false);
  expect(facultyLiveMutationSchema.safeParse({...input,confirm:false}).success).toBe(false);
  expect(facultyLiveMutationSchema.safeParse({...input,title:"x"}).success).toBe(false);
 });
 it("FAC-LIVE-02 enforces quarter-hour start/end, positive duration and max 12 hours",()=>{
  const input={action:"CREATE",confirm:true,lessonId:id,title:"Live class",meetingUrl:"https://zoom.us/j/123",startsAt:future,endsAt:end};
  expect(facultyLiveMutationSchema.safeParse({...input,startsAt:"2099-01-01T10:07:00.000Z"}).success).toBe(false);
  expect(facultyLiveMutationSchema.safeParse({...input,endsAt:future}).success).toBe(false);
  expect(facultyLiveMutationSchema.safeParse({...input,endsAt:"2099-01-02T00:00:00.000Z"}).success).toBe(false);
  expect(facultyLiveMutationSchema.safeParse({...input,action:"CANCEL",contentId:id,expectedUpdatedAt:future}).success).toBe(false);
  expect(facultyLiveMutationSchema.safeParse({action:"CANCEL",contentId:id,expectedUpdatedAt:future,confirm:true}).success).toBe(true);
 });
 it("FAC-LIVE-03 preserve legacy period-agnostic scheduling and per-delivery lock namespace",()=>{
  expect(facultyLiveWindow({startsAt:future,endsAt:end},{startDate:"2000-01-01",endDate:"2000-01-02"})).toBe(true);
  expect(facultyLiveWindow({startsAt:end,endsAt:future},{startDate:"2099-01-01",endDate:"2099-01-02"})).toBe(false);
  expect(facultyLiveDeliveryLockKey("d1")).toBe("faculty-live-delivery:d1");
  expect(facultyLiveDeliveryLockKey("d1")).not.toBe(facultyLiveDeliveryLockKey("d2"));
 });
 it("FAC-LIVE-04 recognized schedule exclusion constraints map to friendly 409-type domain error",()=>{
  const conflict={cause:{constraint:"section_schedule_events_faculty_no_overlap_excl"}};
  const mapped=mapFacultyScheduleInsertError(conflict);
  expect(mapped).toBeInstanceOf(CoursesServiceError);
  expect((mapped as CoursesServiceError).code).toBe("SCHEDULE_EVENT_CONFLICT");
  const unknown={constraint:"different_constraint"};
  expect(mapFacultyScheduleInsertError(unknown)).toBe(unknown);
 });
});