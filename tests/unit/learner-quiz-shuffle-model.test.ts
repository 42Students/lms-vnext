import {describe,it,expect} from "vitest";
import {shuffleQuizForLearner} from "@/modules/courses/learner-quiz-shuffle-model";
describe("LEARNER-learning-misc-26 learner-question and option shuffle",()=>{
 const rows=Array.from({length:10},(_,i)=>({id:"q"+i,type:"SINGLE_CHOICE" as const,prompt:"Question "+i,points:1,
  sequence:i,options:Array.from({length:7},(_,j)=>({
  id:"o"+i+"-"+j,text:"Choice "+j,sequence:j,correct:j===0,
 }))}));
 it("is deterministic for a given quiz and learner across refreshes",()=>{
  const a=shuffleQuizForLearner(rows,"quiz","student-A",true,true);
  const b=shuffleQuizForLearner(rows,"quiz","student-A",true,true);
  expect(a).toEqual(b);
  expect(a.flatMap(q=>q.options.map(o=>o.id)).sort()).toEqual(
   rows.flatMap(q=>q.options.map(o=>o.id)).sort());
  expect(a.map(q=>q.id).sort()).toEqual(rows.map(q=>q.id).sort());
 });
 it("does not shuffle when both flags are off and still strips authored answer keys",()=>{
  const unchanged=shuffleQuizForLearner(rows,"quiz","student-A",false,false);
  expect(unchanged).toEqual(rows.map(row=>({...row,
   options:row.options.map(({id,text,sequence})=>({id,text,sequence}))})));
  expect(unchanged[0]?.options[0]).not.toHaveProperty("correct");
 });
 it("permutes per learner when flags enabled",()=>{
  const a=shuffleQuizForLearner(rows,"quiz","student-A",true,true);
  const b=shuffleQuizForLearner(rows,"quiz","student-B",true,true);
  expect(a).not.toEqual(b);
  expect(a[0]?.options).not.toEqual(rows.find(x=>x.id===a[0]?.id)?.options);
 });
});
