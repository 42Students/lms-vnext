import {describe,expect,it} from "vitest";
import {facultyAuthoringQuestionsFromResponse} from "@/modules/courses/faculty-quiz-builder-model";
const choice=(text:string,sequence:number)=>({text,correct:sequence===0,sequence});
describe("Quiz persisted ordering",()=>{
 it("sorts source rows and options before displaying, without mutating source",()=>{
  const question=(prompt:string,sequence:number,options:ReturnType<typeof choice>[])=>({
   type:"SINGLE_CHOICE" as const,prompt,points:1,sequence,options});
  const rows=[question("Second",3,[choice("B",1),choice("A",0)]),question("First",1,[choice("D",1),choice("C",0)])];
  const response={quiz:{questions:rows}};
  const hydrated=facultyAuthoringQuestionsFromResponse(response);
  expect(hydrated.map(q=>q.prompt)).toEqual(["First","Second"]);
  expect(hydrated[1]?.options.map(o=>o.text)).toEqual(["A","B"]);
  expect(rows[0]?.prompt).toBe("Second");
  expect(rows[0]?.options[0]?.text).toBe("B");
 });
});
