import {describe,expect,it} from "vitest";
import {facultyAssessmentLifecycleActions,facultyAssessmentLifecyclePayload,
 facultyAssessmentLifecycleWarning} from "@/components/courses/faculty-assessment-lifecycle-model";

describe("Faculty aggregate assessment lifecycle",()=>{
 it("never exposes controls for a shared Offering or archived item",()=>{
  expect(facultyAssessmentLifecycleActions({kind:"QUIZ",owned:false,status:"DRAFT"})).toEqual([]);
  expect(facultyAssessmentLifecycleActions({kind:"ASSIGNMENT",owned:false,status:"PUBLISHED"})).toEqual([]);
  expect(facultyAssessmentLifecycleActions({kind:"QUIZ",owned:true,status:"ARCHIVED"})).toEqual([]);
 });
 it("offers only authorized lifecycle actions by current assessment state",()=>{
  expect(facultyAssessmentLifecycleActions({kind:"QUIZ",owned:true,status:"DRAFT"})).toEqual(["PUBLISH","ARCHIVE"]);
  expect(facultyAssessmentLifecycleActions({kind:"QUIZ",owned:true,status:"PUBLISHED"})).toEqual(["CLOSE","ARCHIVE"]);
  expect(facultyAssessmentLifecycleActions({kind:"QUIZ",owned:true,status:"CLOSED"})).toEqual(["ARCHIVE"]);
  expect(facultyAssessmentLifecycleActions({kind:"ASSIGNMENT",owned:true,status:"DRAFT"})).toEqual(["PUBLISH","ARCHIVE"]);
  expect(facultyAssessmentLifecycleActions({kind:"ASSIGNMENT",owned:true,status:"PUBLISHED"})).toEqual(["ARCHIVE"]);
  expect(facultyAssessmentLifecycleActions({kind:"ASSIGNMENT",owned:true,status:"CLOSED"})).toEqual([]);
 });
 it("builds narrow confirmed token-bearing body using assessment ID only",()=>{
  const common={id:"00000000-0000-4000-8000-000000000001",
    expectedUpdatedAt:"2026-10-14T10:20:00.000Z"};
  expect(facultyAssessmentLifecyclePayload({...common,kind:"QUIZ",action:"CLOSE"})).toEqual({
    action:"CLOSE",quizId:common.id,expectedUpdatedAt:common.expectedUpdatedAt,confirmed:true,
  });
  expect(facultyAssessmentLifecyclePayload({...common,kind:"ASSIGNMENT",action:"ARCHIVE"})).toEqual({
    action:"ARCHIVE",assignmentId:common.id,expectedUpdatedAt:common.expectedUpdatedAt,confirmed:true,
  });
  expect(facultyAssessmentLifecycleWarning("QUIZ","ARCHIVE")).toMatch(/Delete this quiz\?.*cannot be undone/);
  expect(facultyAssessmentLifecycleWarning("ASSIGNMENT","ARCHIVE")).toMatch(/Delete this assignment\?.*cannot be undone/);
 });
});
