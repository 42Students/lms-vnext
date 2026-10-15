import {describe,expect,it} from "vitest";
import {facultyQuizApplyPastedOptions} from "@/modules/courses/faculty-quiz-builder-model";
const blank=[{text:"",correct:true,sequence:0},{text:"",correct:false,sequence:1}];
describe("Faculty bulk answer input",()=>{
 it("fills a new question with two choices and one correct answer",()=>{
  const result=facultyQuizApplyPastedOptions(blank,"Alpha | Beta");
  expect(result.ok).toBe(true);
  if(!result.ok)return;
  expect(result.options.map(x=>x.text)).toEqual(["Alpha","Beta"]);
  expect(result.options.map(x=>x.correct)).toEqual([true,false]);
 });
 it("appends unique options without changing an existing answer",()=>{
  const result=facultyQuizApplyPastedOptions([{text:"A",correct:true,sequence:0},{text:"B",correct:false,sequence:1}],"C\nD");
  expect(result.ok).toBe(true);
  if(!result.ok)return;
  expect(result.options.map(x=>x.text)).toEqual(["A","B","C","D"]);
  expect(result.options[0]?.correct).toBe(true);
 });
 it("rejects duplicates and overflow instead of silently truncating",()=>{
  expect(facultyQuizApplyPastedOptions(blank,"A|a").ok).toBe(false);
  expect(facultyQuizApplyPastedOptions(Array.from({length:20},(_,i)=>({text:"O"+i,correct:i===0,sequence:i})),"Extra").ok).toBe(false);
  expect(facultyQuizApplyPastedOptions(blank,"only one").ok).toBe(false);
 });
});