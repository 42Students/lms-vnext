import {describe,expect,it} from "vitest";
import {facultyAssignmentGradingAllowed,facultyAssignmentGradePublicationAllowed} from "@/modules/courses/faculty-assignment-grading-policy";
import {facultyGradeHasChanges} from "@/modules/courses/faculty-grade-noop-model";
import {facultyGradeEditorState} from "@/modules/courses/faculty-grade-editor-model";
import {facultyAssessmentLimitEditable,facultyAssessmentLimitPatch,facultyAssessmentCanArchive,
 facultyAssessmentEditReceiptMatches,facultyAssessmentArchiveReceiptMatches} from "@/modules/courses/faculty-assessment-editor-model";
import {facultyLivePublishedMutationAllowed} from "@/modules/courses/faculty-live-published-policy";
import {facultyQuizResultsCommandSchema,facultyQuizResultsTransition} from "@/modules/courses/faculty-quiz-results-command-model";

const id="11111111-1111-4111-8111-111111111111";
const now=new Date("2026-10-18T04:35:00Z");
describe("COURSES-BREAK-FACULTY-01 grading, result release and immutable learner work",()=>{
 it("rejects grading archived/draft quizzes and invalid, fractional, negative, overflowing points",()=>{
  expect(facultyAssignmentGradingAllowed("PUBLISHED",10,10)).toBe(true);
  expect(facultyAssignmentGradingAllowed("PUBLISHED",0,0)).toBe(true);
  for(const bad of [[1.2,10],[-1,10],[11,10],[1,-1],[NaN,10],[Infinity,10],[1,NaN]]){
   expect(facultyAssignmentGradingAllowed("PUBLISHED",bad[0]!,bad[1]!)).toBe(false);
  }
  for(const status of ["DRAFT","CLOSED","ARCHIVED"]){
   expect(facultyAssignmentGradingAllowed(status,5,10)).toBe(false);
   expect(facultyAssignmentGradePublicationAllowed(status,"GRADED")).toBe(false);
  }
  expect(facultyAssignmentGradePublicationAllowed("PUBLISHED","GRADED")).toBe(true);
  expect(facultyAssignmentGradePublicationAllowed("PUBLISHED","SUBMITTED")).toBe(false);
 });
 it("prevents accidental empty=zero grade and blocks publication until persisted grade is unchanged",()=>{
  const saved={gradingStatus:"GRADED",pointsAwarded:5,feedback:"Well done",gradePublished:false};
  expect(facultyGradeEditorState(saved,"","Well done",10).points).toBeNull();
  expect(facultyGradeEditorState(saved,"-1","Well done",10).canPublish).toBe(false);
  expect(facultyGradeEditorState(saved,"11","Well done",10).canPublish).toBe(false);
  expect(facultyGradeEditorState(saved,"5.5","Well done",10).canPublish).toBe(false);
  expect(facultyGradeEditorState(saved,"5","Well done",10)).toMatchObject({
   points:5,hasChanges:false,canPublish:true,
  });
  expect(facultyGradeEditorState({...saved,gradePublished:true},"5","Well done",10).canPublish).toBe(false);
  expect(facultyGradeEditorState({...saved,gradingStatus:"SUBMITTED"},"5","Well done",10).canPublish).toBe(false);
  expect(facultyGradeEditorState(saved,"6","Well done",10).canPublish).toBe(false);
  expect(facultyGradeHasChanges(saved,{pointsAwarded:5,feedback:"  Well done  "})).toBe(false);
  expect(facultyGradeHasChanges(saved,{pointsAwarded:5,feedback:"Needs revision"})).toBe(true);
 });
 it("published quiz attempt limits cannot mutate; archived assessment cannot be re-archived",()=>{
  expect(facultyAssessmentLimitEditable("QUIZ","DRAFT")).toBe(true);
  expect(facultyAssessmentLimitEditable("QUIZ","PUBLISHED")).toBe(false);
  expect(facultyAssessmentLimitEditable("QUIZ","CLOSED")).toBe(false);
  expect(facultyAssessmentLimitPatch("QUIZ","PUBLISHED",5)).toEqual({});
  expect(facultyAssessmentLimitPatch("QUIZ","DRAFT",5)).toEqual({maxAttempts:5});
  expect(facultyAssessmentLimitPatch("ASSIGNMENT","PUBLISHED",20)).toEqual({maxPoints:20});
  for(const status of ["DRAFT","PUBLISHED","CLOSED"])expect(facultyAssessmentCanArchive("QUIZ",status)).toBe(true);
  expect(facultyAssessmentCanArchive("QUIZ","ARCHIVED")).toBe(false);
  expect(facultyAssessmentCanArchive("ASSIGNMENT","CLOSED")).toBe(false);
 });
 it("rejects forged or stale edit/archive receipts with unrelated assessment IDs or states",()=>{
  const receipt={quiz:{id,status:"DRAFT",title:"Quiz A",updatedAt:"2026-10-18T04:35:00.000Z"}};
  expect(facultyAssessmentEditReceiptMatches("QUIZ",id,"DRAFT","Quiz A",receipt)).toBe(true);
  expect(facultyAssessmentEditReceiptMatches("QUIZ",id,"ARCHIVED","Quiz A",receipt)).toBe(false);
  expect(facultyAssessmentEditReceiptMatches("QUIZ","22222222-2222-4222-8222-222222222222","DRAFT","Quiz A",receipt)).toBe(false);
  expect(facultyAssessmentEditReceiptMatches("QUIZ",id,"DRAFT","Quiz A",{quiz:{...receipt.quiz,updatedAt:"invalid"}})).toBe(false);
  expect(facultyAssessmentArchiveReceiptMatches("QUIZ",id,"Quiz A",{quiz:{...receipt.quiz,status:"ARCHIVED"}})).toBe(true);
  expect(facultyAssessmentArchiveReceiptMatches("QUIZ",id,"Quiz A",receipt)).toBe(false);
  expect(facultyAssessmentEditReceiptMatches("QUIZ",id,"DRAFT","Quiz A",null)).toBe(false);
 });
 it("only published live classes may be rescheduled or cancelled",()=>{
  for(const status of ["DRAFT","ARCHIVED","CLOSED",null,undefined,"SCHEDULED"])
    expect(facultyLivePublishedMutationAllowed(status)).toBe(false);
  expect(facultyLivePublishedMutationAllowed("PUBLISHED")).toBe(true);
 });
 it("requires scope, optimistic version and explicit confirmation before quiz result changes",()=>{
  const command={deliveryId:id,action:"PUBLISH",expectedUpdatedAt:now.toISOString(),confirmed:true};
  expect(facultyQuizResultsCommandSchema.safeParse(command).success).toBe(true);
  for(const invalid of [
   {...command,deliveryId:"other-college"},{...command,confirmed:false},
   {...command,action:"DELETE"},{...command,expectedUpdatedAt:"invalid"},
   {...command,force:true},
  ])expect(facultyQuizResultsCommandSchema.safeParse(invalid).success).toBe(false);
 });
 it("cannot release quiz answers before deadline, on archived quiz or twice; only hides released results",()=>{
  const future=new Date(now.getTime()+1),past=new Date(now.getTime()-1);
  expect(facultyQuizResultsTransition("PUBLISHED",false,"PUBLISH",past,now)).toBe(true);
  expect(facultyQuizResultsTransition("PUBLISHED",false,"PUBLISH",future,now)).toBe(false);
  expect(facultyQuizResultsTransition("PUBLISHED",false,"PUBLISH",null,now)).toBe(false);
  expect(facultyQuizResultsTransition("CLOSED",false,"PUBLISH",null,now)).toBe(true);
  expect(facultyQuizResultsTransition("ARCHIVED",false,"PUBLISH",past,now)).toBe(false);
  expect(facultyQuizResultsTransition("PUBLISHED",true,"PUBLISH",past,now)).toBe(false);
  expect(facultyQuizResultsTransition("CLOSED",true,"HIDE",null,now)).toBe(true);
  expect(facultyQuizResultsTransition("CLOSED",false,"HIDE",null,now)).toBe(false);
 });
});
