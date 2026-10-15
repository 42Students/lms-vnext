import {describe,expect,it} from "vitest";
import {facultyQuizNormalizeQuestions,facultyMoveQuizQuestion,facultyMoveQuizOption} from "@/modules/courses/faculty-quiz-builder-model";
import {facultyQuizCommandSchema} from "@/modules/courses/faculty-quiz-authoring-model";
const lessonId="00000000-0000-4000-8000-000000000001";
describe("Faculty ordered Quiz persisted command",()=>{
 it("normalizes sequences after editing order and passes the real Zod command",()=>{
  const items=[{type:"SINGLE_CHOICE" as const,prompt:"First?",points:5,sequence:20,
   options:[{text:"Yes",correct:true,sequence:6},{text:"No",correct:false,sequence:8}]},
  {type:"SINGLE_CHOICE" as const,prompt:"Second?",points:1,sequence:50,
   options:[{text:"True",correct:true,sequence:2},{text:"False",correct:false,sequence:4}]}];
  const moved=facultyMoveQuizQuestion(items,0,1);
  const updated=facultyQuizNormalizeQuestions(moved.map(q=>({...q,options:facultyMoveQuizOption(q.options,0,1)})));
  expect(updated.map(x=>x.sequence)).toEqual([0,1]);
  expect(updated[0]?.options.map(x=>x.sequence)).toEqual([0,1]);
  expect(facultyQuizCommandSchema.safeParse({action:"CREATE",lessonId,sequence:0,title:"Reordered",
   description:null,dueAt:null,maxAttempts:1,questions:updated,confirmed:true}).success).toBe(true);
 });
});