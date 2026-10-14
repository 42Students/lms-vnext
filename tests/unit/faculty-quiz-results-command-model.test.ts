import {describe,expect,it} from "vitest";
import {facultyQuizResultsCommandSchema,facultyQuizResultsTransition}
 from "@/modules/courses/faculty-quiz-results-command-model";
describe("Faculty Quiz results visibility",()=>{
 it("requires current token, confirmation and bounded exact Section",()=>{
  const ok={deliveryId:"00000000-0000-4000-8000-000000000001",
   action:"PUBLISH",expectedUpdatedAt:"2026-10-14T12:00:00.123Z",confirmed:true};
  expect(facultyQuizResultsCommandSchema.safeParse(ok).success).toBe(true);
  expect(facultyQuizResultsCommandSchema.safeParse({...ok,confirmed:false}).success).toBe(false);
  expect(facultyQuizResultsCommandSchema.safeParse({...ok,collegeId:ok.deliveryId}).success).toBe(false);
 });
 it("permits only meaningful visibility changes on closed Quiz",()=>{
  expect(facultyQuizResultsTransition("CLOSED",false,"PUBLISH")).toBe(true);
  expect(facultyQuizResultsTransition("CLOSED",true,"HIDE")).toBe(true);
  expect(facultyQuizResultsTransition("PUBLISHED",false,"PUBLISH")).toBe(false);
  expect(facultyQuizResultsTransition("CLOSED",true,"PUBLISH")).toBe(false);
 });
});
