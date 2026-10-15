import {describe,expect,it} from "vitest";
import {facultyDuplicateQuizQuestion} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty duplicate question",()=>{
 it("copies prompt/options but does not alias mutable draft options",()=>{
  const source=[{prompt:"Explain",options:[{text:"Yes",correct:true},{text:"No",correct:false}]}];
  const cloned=facultyDuplicateQuizQuestion(source,0);
  expect(cloned).toHaveLength(2);
  expect(cloned[1]).toEqual(cloned[0]);
  expect(cloned[1]).not.toBe(cloned[0]);
  expect(cloned[1]?.options[0]).not.toBe(cloned[0]?.options[0]);
 });
 it("respects hundred question limit",()=>expect(facultyDuplicateQuizQuestion(Array.from({length:100},()=>({options:[]})),0)).toHaveLength(100));
});