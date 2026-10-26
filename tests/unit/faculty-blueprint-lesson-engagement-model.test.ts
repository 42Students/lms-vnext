import {describe,it,expect} from "vitest";
import {facultyBlueprintLessonEngagement} from "../../src/modules/courses/faculty-blueprint-lesson-engagement-model";
const done={membershipId:"a",itemId:"video",attempt:1,completedAt:new Date(),
 legacyWasDeleted:false,lastPositionSeconds:20};
describe("Faculty Blueprint lesson engagement",()=>{
 it("counts only unique authorized learners and completed measurable work",()=>{
  expect(facultyBlueprintLessonEngagement({
   learnerIds:["a","b","a"],lessons:[{lessonId:"one",videoIds:["video","video"],
    assignmentIds:["assn"],quizIds:["quiz"]}],
   videos:[done,{...done,membershipId:"outsider"}],
   quizzes:[{membershipId:"a",itemId:"quiz",attemptNumber:1,submittedAt:new Date(),score:1,maxScore:1}],
   assignments:[{membershipId:"a",itemId:"assn"},{membershipId:"outsider",itemId:"assn"}],
  })).toEqual([{lessonId:"one",rosterTotal:2,trackedItems:3,engagedBy:1,completedBy:1}]);
 });
 it("ignores deleted latest video attempt and untracked resource-only lessons",()=>{
  expect(facultyBlueprintLessonEngagement({
   learnerIds:["a","b"],lessons:[{lessonId:"resource",videoIds:[],assignmentIds:[],quizIds:[]},
    {lessonId:"video",videoIds:["video"],assignmentIds:[],quizIds:[]}],
   videos:[done,{...done,attempt:2,completedAt:null,legacyWasDeleted:true}],
   quizzes:[],assignments:[],
  })).toEqual([
   {lessonId:"resource",rosterTotal:2,trackedItems:0,engagedBy:0,completedBy:0},
   {lessonId:"video",rosterTotal:2,trackedItems:1,engagedBy:0,completedBy:0},
  ]);
 });
});
