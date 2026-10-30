import {describe,expect,it} from "vitest";
import {facultyAuthoringQuestionsFromResponse,facultyQuizDraftIssue,facultyQuizShuffleSettingsFromResponse} from "@/modules/courses/faculty-quiz-builder-model";

describe("faculty saved shuffle settings",()=>{
 it("rehydrates true/false independently from the authenticated Quiz detail",()=>{
  expect(facultyQuizShuffleSettingsFromResponse({quiz:{
   quiz:{shuffleQuestions:true,shuffleOptions:false},questions:[],
  }})).toEqual({shuffleQuestions:true,shuffleOptions:false});
  expect(facultyQuizShuffleSettingsFromResponse({quiz:{
   quiz:{shuffleQuestions:false,shuffleOptions:true},questions:[],
  }})).toEqual({shuffleQuestions:false,shuffleOptions:true});
 });
 it("fails closed for missing or non-boolean persisted flags",()=>{
  for(const input of [
   null,{}, {quiz:{questions:[]}},
   {quiz:{quiz:{shuffleQuestions:true},questions:[]}},
   {quiz:{quiz:{shuffleQuestions:"true",shuffleOptions:false},questions:[]}},
  ])expect(()=>facultyQuizShuffleSettingsFromResponse(input)).toThrow(/shuffle settings are unavailable/);
 });
});

describe("faculty quiz editing saved answers",()=>{
 it("round trips the persisted correct answer through edit validation",()=>{
  const loaded=facultyAuthoringQuestionsFromResponse({quiz:{questions:[{
   type:"SINGLE_CHOICE",prompt:"FIFO is?",points:1,sequence:0,
   options:[
    {id:"00000000-0000-4000-8000-000000000001",text:"Queue",correct:true,sequence:0},
    {id:"00000000-0000-4000-8000-000000000002",text:"Stack",correct:false,sequence:1},
   ],
  }]}});
  expect(loaded[0]?.options.map(option=>option.correct)).toEqual([true,false]);
  const edited=loaded.map(question=>({...question,prompt:"FIFO structure?"}));
  expect(facultyQuizDraftIssue("A valid saved draft",edited)).toBeNull();
 });
 it("refuses a saved single-choice draft when the answer key is omitted",()=>{
  const loaded=facultyAuthoringQuestionsFromResponse({quiz:{questions:[{
   type:"SINGLE_CHOICE",prompt:"FIFO is?",points:1,sequence:0,
   options:[
    {text:"Queue",sequence:0},{text:"Stack",sequence:1},
   ],
  }]}});
  expect(facultyQuizDraftIssue("Cannot edit without correct flags",loaded)).not.toBeNull();
 });
});
