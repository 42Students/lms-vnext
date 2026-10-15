import {describe,expect,it} from "vitest";
import {learnerRoadmapEmptyState} from "@/modules/courses/learner-roadmap-empty-state-model";
describe("published learner Learning Path empty states",()=>{
 it("distinguishes unpublished path, no lessons and lessons without items",()=>{
  expect(learnerRoadmapEmptyState(false,[])).toMatchObject({title:"Learning path is being prepared"});
  expect(learnerRoadmapEmptyState(true,[])).toMatchObject({title:"No lessons published yet"});
  expect(learnerRoadmapEmptyState(true,[{items:[]}])).toMatchObject({title:"No learning items published yet"});
  expect(learnerRoadmapEmptyState(true,[{items:[1]}])).toBeNull();
 });
});
