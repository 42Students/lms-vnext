import {describe,expect,it} from "vitest";
import {shuffleQuizForLearner,type QuizDisplayQuestion} from "@/modules/courses/learner-quiz-shuffle-model";
const questions:QuizDisplayQuestion[]=[
 {id:"question-one",type:"SINGLE_CHOICE",prompt:"Which is true?",points:1,sequence:0,
  options:[
   {id:"first",text:"A",correct:true,sequence:0},
   {id:"second",text:"B",correct:false,sequence:1},
  ]},
 {id:"question-two",type:"MULTIPLE_CHOICE",prompt:"Choose matches",points:3,sequence:1,
  options:[
   {id:"third",text:"C",correct:false,sequence:0},
   {id:"fourth",text:"D",correct:true,sequence:1},
  ]},
];
describe("LEARNER-QUIZ-KEY-01 never expose authored correctness in learner quiz display",()=>{
 it("strips answer-key flags even when shuffle is disabled",()=>{
  const result=shuffleQuizForLearner(questions,"quiz-1","member-1",false,false);
  expect(result).toEqual(questions.map(question=>({
   id:question.id,type:question.type,prompt:question.prompt,
   points:question.points,sequence:question.sequence,
   options:question.options.map(({id,text,sequence})=>({id,text,sequence})),
  })));
  for(const question of result)for(const option of question.options){
   expect(option).not.toHaveProperty("correct");
   expect(option).not.toHaveProperty("isCorrect");
  }
  expect(questions[0]?.options[0]?.correct).toBe(true);
 });
 it("keeps stable per-learner question/option IDs while discarding any extra runtime secrets",()=>{
  const hostile=[{...questions[0]!,privateAnswer:"option-one",
   options:[{...questions[0]!.options[0]!,secret:"answer-key"},questions[0]!.options[1]!]},
   questions[1]! ] as unknown as QuizDisplayQuestion[];
  const first=shuffleQuizForLearner(hostile,"quiz-1","member-1",true,true);
  const second=shuffleQuizForLearner(hostile,"quiz-1","member-1",true,true);
  expect(first).toEqual(second);
  expect(first.map(item=>item.id).sort()).toEqual(["question-one","question-two"]);
  for(const item of first){
   expect(item).not.toHaveProperty("privateAnswer");
   for(const option of item.options){
    expect(option).not.toHaveProperty("correct");
    expect(option).not.toHaveProperty("secret");
   }
  }
  expect(hostile[0]?.options[0]).toHaveProperty("secret","answer-key");
 });
});
