import {describe,expect,it} from "vitest";
import {CoursesServiceError} from "@/modules/courses/errors";
import {parseFacultyAssessmentReportRoute,facultyAssignmentReportHidden,facultyQuizReportHidden} from "@/modules/courses/faculty-assessment-route-boundary";

const id="00000000-0000-4000-8000-000000000001";
describe("Faculty Assignment report route boundary",()=>{
 it("accepts own path identity and optional exact Section",()=>{
  expect(parseFacultyAssessmentReportRoute(id,{})).toEqual({assessmentId:id,deliveryId:null});
  expect(parseFacultyAssessmentReportRoute(id,{deliveryId:id})).toEqual({assessmentId:id,deliveryId:id});
 });
 it("rejects malformed, repeated, or scope-forging parameters",()=>{
  expect(parseFacultyAssessmentReportRoute("not-uuid",{})).toBeNull();
  for(const input of [{deliveryId:[id,id]},{collegeId:id},{contentId:id},{deliveryId:"bad"}]){
   expect(parseFacultyAssessmentReportRoute(id,input)).toBeNull();
  }
 });
 it("hides unassigned reports but preserves unrelated failures",()=>{
  for(const code of ["ASSIGNMENT_NOT_FOUND","ASSIGNMENT_DELIVERY_MISMATCH",
   "SECTION_DELIVERY_NOT_FOUND","FACULTY_TEACHING_SCOPE_REQUIRED","LEARNING_ACCESS_DENIED"] as const){
    expect(facultyAssignmentReportHidden(new CoursesServiceError(code))).toBe(true);
  }
  expect(facultyAssignmentReportHidden(new Error("Unavailable database"))).toBe(false);
 });
});

describe("Faculty Quiz summary private route boundary",()=>{
 it("rejects invalid, duplicated or fabricated Section filters",()=>{
  expect(parseFacultyAssessmentReportRoute(id,{deliveryId:id})).not.toBeNull();
  expect(parseFacultyAssessmentReportRoute(id,{deliveryId:[id,id]})).toBeNull();
  expect(parseFacultyAssessmentReportRoute(id,{collegeId:id})).toBeNull();
 });
 it("masks missing, mismatched and unassigned Quiz reports",()=>{
  for(const code of ["QUIZ_NOT_FOUND","QUIZ_DELIVERY_MISMATCH",
   "SECTION_DELIVERY_NOT_FOUND","FACULTY_TEACHING_SCOPE_REQUIRED",
   "LEARNING_ACCESS_DENIED"] as const){
   expect(facultyQuizReportHidden(new CoursesServiceError(code))).toBe(true);
  }
  expect(facultyQuizReportHidden(new Error("SQL connection failed"))).toBe(false);
 });
});
