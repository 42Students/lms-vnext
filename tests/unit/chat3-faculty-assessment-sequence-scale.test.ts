import {describe,expect,it} from "vitest";
import {
 facultyAssessmentVisibleToDelivery,nextFacultyLessonContentSequence,
} from "@/modules/courses/faculty-assessment-batch-model";
const own="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
describe("FAC-ASSESSMENT-SCALE-03 deterministic large lesson authoring order",()=>{
 it("calculates next content sequence without argument spreading over thousands of cards",()=>{
  const sequences=Array.from({length:130000},(_,i)=>i);
  expect(nextFacultyLessonContentSequence(sequences)).toBe(130000);
  expect(sequences).toHaveLength(130000);
 });
 it("preserves empty, sparse and unsorted lesson order semantics",()=>{
  expect(nextFacultyLessonContentSequence([])).toBe(0);
  expect(nextFacultyLessonContentSequence([5,0,20,4])).toBe(21);
  expect(nextFacultyLessonContentSequence([0,0])).toBe(1);
 });
 it("rejects corrupted noninteger, negative and unsafe positions without fabricating a safe slot",()=>{
  for(const value of [-1,1.5,Number.NaN,Number.POSITIVE_INFINITY,
   Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER+1]){
   expect(()=>nextFacultyLessonContentSequence([0,value]))
    .toThrow("INVALID_FACULTY_LESSON_SEQUENCE");
  }
 });
 it("retains strict shared versus sibling Section assessment targeting",()=>{
  expect(facultyAssessmentVisibleToDelivery({deliveryId:null},own)).toBe(true);
  expect(facultyAssessmentVisibleToDelivery({deliveryId:own},own)).toBe(true);
  expect(facultyAssessmentVisibleToDelivery({deliveryId:foreign},own)).toBe(false);
 });
});