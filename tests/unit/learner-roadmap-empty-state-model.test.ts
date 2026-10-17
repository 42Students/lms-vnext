import {describe,expect,it} from "vitest";
import {learnerRoadmapEmptyState} from "@/modules/courses/learner-roadmap-empty-state-model";
describe("published learner Learning Path empty states",()=>{
 it("LEARNER-course-detail-20 distinguishes unpublished path, no roadmap items and lessons without content",()=>{
  expect(learnerRoadmapEmptyState(false,[])).toMatchObject({title:"No roadmap items yet"});
  expect(learnerRoadmapEmptyState(true,[])).toMatchObject({title:"No roadmap items yet"});
  expect(learnerRoadmapEmptyState(true,[{items:[]}])).toMatchObject({title:"No lesson content yet"});
  expect(learnerRoadmapEmptyState(true,[{items:[1]}])).toBeNull();
 });
});
