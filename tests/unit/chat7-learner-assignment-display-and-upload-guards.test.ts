import { describe, expect, it } from "vitest";
import { assignmentOverviewState } from "@/modules/courses/learner-assignment-display";
import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";
import { learnerDueSoonNotices } from "@/modules/courses/learner-assignment-due-notice-model";
import { selectLearnerAssignmentFile } from "@/modules/courses/learner-assignment-file-selection-model";
import { learnerCourseMatchesTermState } from "@/modules/courses/learner-course-term-state-model";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const now = Date.parse("2099-03-01T12:00:00.000Z");
const assignment = {submittedAt:null, dueAt:new Date(now+60_000).toISOString(),gradePublished:false,pointsAwarded:null,maxPoints:20};

describe("COURSES7-06 learner assignment overview integrity", () => {
 it("never invents a scored zero when a published grade has no stored marks", () => {
  const result=assignmentOverviewState({...assignment,gradePublished:true},now);
  expect(result).toEqual({label:"Graded · score unavailable",tone:"success",action:"View"});
  expect(learnerAssignmentPublishedGradeLabel(null,20)).toBe("Graded · score unavailable");
  expect(learnerAssignmentPublishedGradeLabel(0,20)).toBe("Graded · 0/20");
 });
 it("shows persisted submitted state before a stale or expired deadline action", () => {
  expect(assignmentOverviewState({...assignment,submittedAt:new Date(now-60_000).toISOString(),dueAt:new Date(now-120_000).toISOString()},now))
   .toEqual({label:"Submitted late · awaiting grade",tone:"info",action:"View"});
  expect(assignmentOverviewState({...assignment,submittedAt:new Date(now-60_000).toISOString()},now).action).toBe("View");
  expect(assignmentOverviewState({...assignment,dueAt:null},now).action).toBe("View");
 });
 it("LEARNER-learning-misc-05 denies an unsubmitted assignment exactly at deadline",()=>{
  expect(assignmentOverviewState({...assignment,dueAt:new Date(now).toISOString()},now))
   .toEqual({label:"Closed · not submitted",tone:"warning",action:"View"});
  expect(assignmentOverviewState(assignment,now)).toMatchObject({label:"Due soon",action:"Submit"});
  expect(assignmentOverviewState({...assignment,dueAt:new Date(now+60*60*49*1000).toISOString()},now))
   .toMatchObject({label:"Not submitted",action:"Submit"});
 });
 it("LEARNER-learning-misc-05 reminders contain only future, unsubmitted, finite deadlines",()=>{
  const rows=[
   {id:"due",title:"Assignment due",deliveryId,dueAt:new Date(now+3600000),submissionId:null},
   {id:"done",title:"Completed",deliveryId,dueAt:new Date(now+3600000),submissionId:"submitted"},
   {id:"past",title:"Expired",deliveryId,dueAt:new Date(now-1),submissionId:null},
   {id:"none",title:"Missing",deliveryId,dueAt:null,submissionId:null},
   {id:"invalid",title:"Invalid",deliveryId,dueAt:new Date("invalid"),submissionId:null},
  ];
  const notices=learnerDueSoonNotices(rows,new Date(now),48);
  expect(notices).toHaveLength(1);
  expect(notices[0]).toMatchObject({key:"due:"+deliveryId,title:"Assignment due soon",
   href:"/learn/allAssignments/due?deliveryId="+deliveryId});
  expect(notices[0].body).toContain("Due ");
 });
 it("COURSES7-08 rejects unsupported files before requesting a signed upload grant",()=>{
  const valid={name:"answers.pdf",type:"",size:1024};
  expect(selectLearnerAssignmentFile(deliveryId,valid)).toEqual({file:valid,error:null});
  expect(selectLearnerAssignmentFile(deliveryId,{...valid,name:"answers.exe"}).error).not.toBeNull();
  expect(selectLearnerAssignmentFile(deliveryId,{...valid,size:50*1024*1024+1}).error).not.toBeNull();
  expect(selectLearnerAssignmentFile("invalid",valid).error).not.toBeNull();
  expect(selectLearnerAssignmentFile(deliveryId,null)).toEqual({file:null,error:null});
 });
 it("COURSES7-09 uses server persisted course readOnly state, not device clock",()=>{
  expect(learnerCourseMatchesTermState({readOnly:false},"CURRENT")).toBe(true);
  expect(learnerCourseMatchesTermState({readOnly:true},"CURRENT")).toBe(false);
  expect(learnerCourseMatchesTermState({readOnly:true},"HISTORY")).toBe(true);
  expect(learnerCourseMatchesTermState({readOnly:false},"HISTORY")).toBe(false);
  expect(learnerCourseMatchesTermState({readOnly:true},"unsupported")).toBe(true);
 });
});
