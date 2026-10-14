import {describe,expect,it} from "vitest";
import {facultyRegradeFeedbackAllowed} from "@/modules/courses/faculty-regrade-feedback-model";
describe("Faculty published-grade regrading feedback",()=>{
 it("permits initial grading without feedback but requires an explanation after publish",()=>{
  expect(facultyRegradeFeedbackAllowed(false,null)).toBe(true);
  expect(facultyRegradeFeedbackAllowed(true,null)).toBe(false);
  expect(facultyRegradeFeedbackAllowed(true,"  tiny  ")).toBe(false);
  expect(facultyRegradeFeedbackAllowed(true,"Corrected based on rubric")).toBe(true);
 });
});
