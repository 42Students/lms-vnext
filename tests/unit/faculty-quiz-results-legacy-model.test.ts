import {describe,expect,it} from "vitest";
import {legacyQuizResultsWriteAllowed} from "@/modules/courses/faculty-quiz-results-legacy-model";
describe("Admin-only legacy Quiz results route",()=>{
 it("cannot bypass Faculty confirmation and authoring fences",()=>{
  expect(legacyQuizResultsWriteAllowed(false,"CLOSED",false,true)).toBe(false);
  expect(legacyQuizResultsWriteAllowed(true,"PUBLISHED",false,true)).toBe(false);
  expect(legacyQuizResultsWriteAllowed(true,"ARCHIVED",true,false)).toBe(false);
  expect(legacyQuizResultsWriteAllowed(true,"CLOSED",true,true)).toBe(false);
  expect(legacyQuizResultsWriteAllowed(true,"CLOSED",false,true)).toBe(true);
  expect(legacyQuizResultsWriteAllowed(true,"CLOSED",true,false)).toBe(true);
 });
});
