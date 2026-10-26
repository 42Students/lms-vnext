import {describe,expect,it} from "vitest";
import {facultyGradingSelectedSubmission} from "../../src/modules/courses/faculty-grading-selection-model";
const pending={id:"pending",gradingStatus:"NOT_GRADED"},graded={id:"graded",gradingStatus:"GRADED"};
describe("Faculty prototype grading filter-deeplink scope",()=>{
 it("never selects a pending row inside the Graded filter",()=>{
  expect(facultyGradingSelectedSubmission([graded],"pending")).toEqual(graded);
 });
 it("never selects a graded row inside the To grade filter",()=>{
  expect(facultyGradingSelectedSubmission([pending],"graded")).toEqual(pending);
 });
 it("preserves allowed exact selection, and hides Missing/empty filters",()=>{
  expect(facultyGradingSelectedSubmission([pending,graded],"graded")).toEqual(graded);
  expect(facultyGradingSelectedSubmission([pending,graded],undefined)).toEqual(pending);
  expect(facultyGradingSelectedSubmission([],graded.id)).toBeNull();
  expect(facultyGradingSelectedSubmission([])).toBeNull();
 });
});
