import {describe,it,expect} from "vitest";
import {facultyCourseCompletion} from "@/modules/courses/faculty-course-completion-model";
describe("Faculty prototype course completion",()=>{
 const base={
  learnerIds:["A","B"],videoIds:["v1","v2"],assignmentIds:["a1"],quizIds:["q1"],
  videos:[
   {membershipId:"A",itemId:"v1",attempt:1,completedAt:new Date("2026-10-01"),legacyWasDeleted:null},
   {membershipId:"A",itemId:"v1",attempt:2,completedAt:null,legacyWasDeleted:false},
   {membershipId:"B",itemId:"v1",attempt:1,completedAt:new Date("2026-10-01"),legacyWasDeleted:false},
   {membershipId:"B",itemId:"v2",attempt:1,completedAt:new Date("2026-10-01"),legacyWasDeleted:false},
  ],
  assignments:[{membershipId:"A",itemId:"a1"}],
  quizzes:[
   {membershipId:"B",itemId:"q1",attemptNumber:1,submittedAt:new Date("2026-10-01"),score:9,maxScore:10},
   {membershipId:"B",itemId:"q1",attemptNumber:2,submittedAt:new Date("2026-10-02"),score:6,maxScore:10},
  ],
 };
 it("counts visible items once, latest attempts only and under-30% learners",()=>{
  const result=facultyCourseCompletion(base);
  expect(result.itemsMeasured).toBe(4);
  expect(result.byLearner).toEqual([
   {membershipId:"A",completed:1,total:4,progressPercent:25},
   {membershipId:"B",completed:3,total:4,progressPercent:75},
  ]);
  expect(result.behindTotal).toBe(1);
  expect(result.averagePercent).toBe(50);
  expect(result.quizAveragePercent).toBe(60);
  expect(result.quizAttemptsById).toEqual([{quizId:"q1",attempted:1}]);
 });
 it("returns unknown rather than invented progress when no published items exist",()=>{
  const result=facultyCourseCompletion({
   ...base,videoIds:[],assignmentIds:[],quizIds:[],
  });
  expect(result.itemsMeasured).toBe(0);
  expect(result.averagePercent).toBeNull();
  expect(result.behindTotal).toBeNull();
  expect(result.byLearner[0]?.progressPercent).toBeNull();
 });
});
