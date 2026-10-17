import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {QUIZ_QUESTION_TYPES} from "@/modules/courses/constants";
import {createCourseQuizInputSchema} from "@/modules/courses/quiz-validation";
const read=(p:string)=>readFileSync(p,"utf8");
describe("LEARNER-learning-misc-25 safe quiz content decision",()=>{
 it("LEARNER-learning-misc-25 deliberately allows only authored choice questions with server-graded options",()=>{
  expect(QUIZ_QUESTION_TYPES).toEqual(["SINGLE_CHOICE","MULTIPLE_CHOICE"]);
  const sample={lessonId:"123e4567-e89b-42d3-a456-426614174001",title:"Choice quiz",sequence:0,questions:[
   {type:"SHORT_ANSWER",prompt:"Enter your answer",points:1,sequence:0,options:[
    {text:"One",correct:true,sequence:0},{text:"Two",correct:false,sequence:1}]}
  ]};
  expect(createCourseQuizInputSchema.safeParse(sample).success).toBe(false);
  expect(createCourseQuizInputSchema.safeParse({...sample,questions:[
   {...sample.questions[0],type:"SINGLE_CHOICE"}]}).success).toBe(true);
 });
 it("LEARNER-learning-misc-25 escapes faculty question text, rather than injecting arbitrary stored HTML",()=>{
  const learner=read("src/components/courses/learner-quiz-attempt.tsx");
  expect(learner).toContain("Question {index + 1}. {question.prompt}");
  expect(learner).toContain("{option.text}");
  expect(learner).not.toContain("dangerouslySetInnerHTML");
  expect(read("src/modules/courses/quiz-validation.ts")).toContain("z.enum(QUIZ_QUESTION_TYPES)");
 });
});