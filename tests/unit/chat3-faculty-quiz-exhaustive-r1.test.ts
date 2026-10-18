import {describe,it,expect} from "vitest";
import {
 facultyChangeQuizChoiceType,facultyToggleQuizAnswer,facultyRemoveQuizOption,
 facultyRemoveQuizQuestion,facultyAppendQuizQuestion,facultyQuizDraftEditable,
 facultyQuizMetadataEditable,facultyQuizDraftLoadAllowsAction,facultyQuizCanPublishSavedDraft,
 facultyQuizConfirmationAfterEdit,facultyQuizCanRetryDetails,facultyBeginQuizWrite,
 facultyQuizWriteMessage,facultyQuizCanSaveChanges,facultyQuizSwitchNeedsConfirmation,
 facultyDuplicateQuizOption,facultyQuizCopyTitle,facultyQuizDraftIssue,facultyQuizMetadataIssue,
 facultyQuizSavedFromCommand,facultyQuizCanCopyToDraft
} from "@/modules/courses/faculty-quiz-builder-model";
const options=[{correct:true,text:"A"},{correct:false,text:"B"},{correct:false,text:"C"}];
describe("FAC quiz authoring and Section-safe state transitions",()=>{
 it("FAC-QUIZ-01 multiple->single keeps exactly one correct option",()=>{
  const q={type:"MULTIPLE_CHOICE" as const,options:options.map(o=>({...o,correct:true}))};
  expect(facultyChangeQuizChoiceType(q,"SINGLE_CHOICE").options.map(o=>o.correct)).toEqual([true,false,false]);
  expect(facultyChangeQuizChoiceType({...q,type:"SINGLE_CHOICE"},"MULTIPLE_CHOICE").type).toBe("MULTIPLE_CHOICE");
 });
 it("FAC-QUIZ-02 single-choice selection exclusive, can't unset its last answer",()=>{
  expect(facultyToggleQuizAnswer({type:"SINGLE_CHOICE",options},0,false)).toEqual(options);
  expect(facultyToggleQuizAnswer({type:"SINGLE_CHOICE",options},2,true).map(o=>o.correct)).toEqual([false,false,true]);
  expect(facultyToggleQuizAnswer({type:"SINGLE_CHOICE",options},-1,true)).toEqual(options);
 });
 it("FAC-QUIZ-03 multiple-choice cannot have zero or every option correct",()=>{
  expect(facultyToggleQuizAnswer({type:"MULTIPLE_CHOICE",options},0,false)).toEqual(options);
  const almost=[{correct:true},{correct:true},{correct:false}];
  expect(facultyToggleQuizAnswer({type:"MULTIPLE_CHOICE",options:almost},2,true)).toEqual(almost);
  expect(facultyToggleQuizAnswer({type:"MULTIPLE_CHOICE",options},1,true).map(o=>o.correct)).toEqual([true,true,false]);
 });
 it("FAC-QUIZ-04 option removal preserves at least two and exactly one single correct",()=>{
  expect(facultyRemoveQuizOption({type:"SINGLE_CHOICE",options},0).map(o=>o.correct)).toEqual([true,false]);
  expect(facultyRemoveQuizOption({type:"SINGLE_CHOICE",options:options.slice(0,2)},1)).toHaveLength(2);
  expect(facultyRemoveQuizOption({type:"MULTIPLE_CHOICE",options:[{correct:true},{correct:true},{correct:true}]},2).map(o=>o.correct)).toEqual([true,false]);
 });
 it("FAC-QUIZ-05 deleting the last question or adding beyond 100 is denied",()=>{
  expect(facultyRemoveQuizQuestion(["only"],0)).toEqual(["only"]);
  expect(facultyRemoveQuizQuestion([1,2,3],1)).toEqual([1,3]);
  expect(facultyAppendQuizQuestion(Array.from({length:100},(_,i)=>i),101)).toHaveLength(100);
 });
 it("FAC-QUIZ-06 published/closed quizzes can edit metadata but not question bank",()=>{
  expect(facultyQuizDraftEditable("DRAFT")).toBe(true);
  expect(facultyQuizDraftEditable("PUBLISHED")).toBe(false);
  expect(facultyQuizMetadataEditable("PUBLISHED")).toBe(true);
  expect(facultyQuizMetadataEditable("CLOSED")).toBe(true);
  expect(facultyQuizMetadataEditable("ARCHIVED")).toBe(false);
 });
 it("FAC-QUIZ-07 failed bank load/dirty content disables publication",()=>{
  expect(facultyQuizDraftLoadAllowsAction(true,"DRAFT","PUBLISH")).toBe(false);
  expect(facultyQuizDraftLoadAllowsAction(true,"DRAFT","EDIT")).toBe(false);
  expect(facultyQuizDraftLoadAllowsAction(false,"DRAFT","PUBLISH")).toBe(true);
  expect(facultyQuizCanPublishSavedDraft("DRAFT",false,false)).toBe(true);
  expect(facultyQuizCanPublishSavedDraft("DRAFT",true,false)).toBe(false);
  expect(facultyQuizCanPublishSavedDraft("DRAFT",false,true)).toBe(false);
  expect(facultyQuizCanPublishSavedDraft("PUBLISHED",false,false)).toBe(false);
 });
 it("FAC-QUIZ-08 approvals bind to exact revision, switching protects draft, lock blocks repeated writes",()=>{
  const prev={title:"A"},next={title:"B"};
  expect(facultyQuizConfirmationAfterEdit(true,prev,prev)).toBe(true);
  expect(facultyQuizConfirmationAfterEdit(true,prev,next)).toBe(false);
  expect(facultyQuizSwitchNeedsConfirmation(true,"q1","q2")).toBe(true);
  expect(facultyQuizSwitchNeedsConfirmation(true,"q1","q1")).toBe(false);
  const lock={current:false};
  expect(facultyBeginQuizWrite(lock)).toBe(true);
  expect(facultyBeginQuizWrite(lock)).toBe(false);
 });
 it("FAC-QUIZ-09 known stale conflict friendly; internal codes never displayed",()=>{
  expect(facultyQuizWriteMessage({error:"FACULTY_QUIZ_STALE_VERSION"})).toMatch(/changed elsewhere/i);
  expect(facultyQuizWriteMessage({error:"INTERNAL_SQL_ERROR"})).not.toContain("INTERNAL_SQL_ERROR");
  expect(facultyQuizCanRetryDetails(true,"q",false)).toBe(true);
  expect(facultyQuizCanRetryDetails(true,"q",true)).toBe(false);
  expect(facultyQuizCanSaveChanges("PUBLISHED",true,false,false)).toBe(true);
  expect(facultyQuizCanSaveChanges("ARCHIVED",true,false,false)).toBe(false);
 });
 it("FAC-QUIZ-10 duplicate answer is always unselected, copy is a local draft only",()=>{
  expect(facultyDuplicateQuizOption(options,0)[1]?.correct).toBe(false);
  expect(facultyQuizCopyTitle(" My Quiz ")).toBe("Copy of My Quiz");
  expect(facultyQuizCanCopyToDraft("PUBLISHED",true,false,false)).toBe(true);
  expect(facultyQuizCanCopyToDraft("ARCHIVED",true,false,false)).toBe(false);
 });
 it("FAC-QUIZ-11 metadata limits, points and malformed response are rejected",()=>{
  expect(facultyQuizDraftIssue("",[])).toMatch(/Enter a Quiz title/);
  expect(facultyQuizDraftIssue("Test",[{type:"SINGLE_CHOICE",prompt:"Q",points:0,sequence:0,options:[]}])).toMatch(/points/i);
  expect(facultyQuizMetadataIssue("","", "",1)).toMatch(/Quiz title/);
  expect(facultyQuizMetadataIssue("Title","x".repeat(10001),"",1)).toMatch(/too long/i);
  expect(facultyQuizSavedFromCommand({quiz:{id:"bad"}})).toBeNull();
 });
});