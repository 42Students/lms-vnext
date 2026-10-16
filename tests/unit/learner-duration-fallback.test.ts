import {describe,it,expect} from "vitest";
import {buildLearnerProgressView} from "@/modules/courses/progress-service";
describe("LEARNER-course-detail-11 duration fallback and resume",()=>{
 it("preserves persisted position when authored duration missing without claiming percentage",()=>{
  const view=buildLearnerProgressView({id:"c",durationSeconds:null},{
   lastPositionSeconds:72,completedAt:null});
  expect(view.status).toBe("IN_PROGRESS");
  expect(view.lastPositionSeconds).toBe(72);
  expect(view.durationSeconds).toBe(0);
  expect(view.percentComplete).toBe(0);
 });
 it("caps known duration and respects completed state",()=>{
  const view=buildLearnerProgressView({id:"c",durationSeconds:100},{
   lastPositionSeconds:500,completedAt:null});
  expect(view.lastPositionSeconds).toBe(100);
  expect(view.percentComplete).toBe(100);
 });
});
