import {describe,it,expect,vi} from "vitest";
import {CoursesServiceError} from "@/modules/courses/errors";
import {parseFacultyAssessmentReportRoute,facultyAssignmentReportHidden,facultyQuizReportHidden} from "@/modules/courses/faculty-assessment-route-boundary";
vi.mock("@/modules/identity/context",()=>({
 hasMembershipRole:(ctx:{role?:string},role:string)=>ctx.role===role
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:(ctx:{permitted?:boolean;membership?:{collegeId:string;organizationId:string}},permission:string,scope:{collegeId:string;organizationId:string})=>
  Boolean(ctx.permitted&&permission==="courses.read"&&ctx.membership?.collegeId===scope.collegeId&&ctx.membership?.organizationId===scope.organizationId)
}));
import {canAccessFacultyRoute} from "@/modules/courses/faculty-route-access-model";
type Context=NonNullable<Parameters<typeof canAccessFacultyRoute>[0]>;
const context=(role:string,permitted=true,collegeId="college-1"):Context=>
 ({role,permitted,membership:{collegeId,organizationId:"org-1"}} as unknown as Context);
describe("FAC teacher permission and private report route matrix",()=>{
 it("FAC-SCOPE-01 only active faculty with courses.read can access faculty pages",()=>{
  expect(canAccessFacultyRoute(context("FACULTY"))).toBe(true);
  expect(canAccessFacultyRoute(context("LEARNER"))).toBe(false);
  expect(canAccessFacultyRoute(context("MENTOR"))).toBe(false);
  expect(canAccessFacultyRoute(context("COLLEGE_ADMIN"))).toBe(false);
  expect(canAccessFacultyRoute(context("SUPER_ADMIN"))).toBe(false);
  expect(canAccessFacultyRoute(context("FACULTY",false))).toBe(false);
  expect(canAccessFacultyRoute(null)).toBe(false);
  expect(canAccessFacultyRoute(undefined)).toBe(false);
 });
 it("FAC-SCOPE-02 an absent membership denies page authorization rather than borrowing another tenant",()=>{
  expect(canAccessFacultyRoute({role:"FACULTY",permitted:true} as unknown as Context)).toBe(false);
  expect(canAccessFacultyRoute(context("FACULTY",false,"foreign-college"))).toBe(false);
 });
 it("FAC-SCOPE-03 report path refuses non-UUID, unknown query keys and invalid delivery scope",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  expect(parseFacultyAssessmentReportRoute(id,{})).toEqual({assessmentId:id,deliveryId:null});
  expect(parseFacultyAssessmentReportRoute("invalid",{})).toBeNull();
  expect(parseFacultyAssessmentReportRoute(id,{deliveryId:"invalid"})).toBeNull();
  expect(parseFacultyAssessmentReportRoute(id,{sort:"hidden"})).toBeNull();
  expect(parseFacultyAssessmentReportRoute(id,{deliveryId:"22222222-2222-4222-8222-222222222222"})).toEqual({assessmentId:id,deliveryId:"22222222-2222-4222-8222-222222222222"});
 });
 it("FAC-SCOPE-04 teacher assignment/quiz reports hide cross-scope and not-found as private 404",()=>{
  for(const code of ["FACULTY_TEACHING_SCOPE_REQUIRED","LEARNING_ACCESS_DENIED","SECTION_DELIVERY_NOT_FOUND"] as const){
   expect(facultyAssignmentReportHidden(new CoursesServiceError(code))).toBe(true);
   expect(facultyQuizReportHidden(new CoursesServiceError(code))).toBe(true);
  }
  expect(facultyAssignmentReportHidden(new CoursesServiceError("ASSIGNMENT_DELIVERY_MISMATCH"))).toBe(true);
  expect(facultyQuizReportHidden(new CoursesServiceError("QUIZ_DELIVERY_MISMATCH"))).toBe(true);
  expect(facultyAssignmentReportHidden(new CoursesServiceError("ASSIGNMENT_GRADE_INVALID"))).toBe(false);
  expect(facultyQuizReportHidden(new CoursesServiceError("QUIZ_NAME_CONFLICT"))).toBe(false);
  expect(facultyQuizReportHidden(new Error("SQL DETAILS"))).toBe(false);
 });
});