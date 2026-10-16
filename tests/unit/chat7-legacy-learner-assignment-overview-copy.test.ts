import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {assignmentOverviewState} from "@/modules/courses/learner-assignment-display";
describe("Learner assignments dev legacy list and ViewAssignmentModal copy",()=>{
 const ui=readFileSync("src/components/courses/learner-assessment-overview.tsx","utf8");
 it("shows exact empty assignment copy, not a faculty-published invented sentence",()=>{
  expect(ui).toContain("No assignments yet");
  expect(ui).toContain("Your assignments will appear here once your teachers add them.");
  expect(ui).not.toContain("Your assignments will appear here once your Faculty publishes them");
 });
 it("shows exact assignment drawer section headings and submission explanation",()=>{
  for(const text of ["Instructions & resources","Your submission","This is what you submitted for this assignment.","Written Response","Submitted Link"]){
   expect(ui).toContain(text);
  }
 });
 it("preserves exact submission actions View/Submit and privacy-dependent grade states",()=>{
  const pending={submittedAt:null,dueAt:"2030-01-01T00:00:00Z",gradePublished:false,pointsAwarded:null,maxPoints:10};
  expect(assignmentOverviewState(pending,0)).toMatchObject({label:"Not submitted",action:"Submit"});
  expect(assignmentOverviewState({...pending,submittedAt:"2026-10-16T10:00:00Z"},0)).toMatchObject({label:"Submitted · awaiting grade",action:"View"});
  expect(assignmentOverviewState({...pending,submittedAt:"2026-10-16T10:00:00Z",gradePublished:true,pointsAwarded:8},0)).toMatchObject({label:"Graded · 8/10",action:"View"});
 });
});
