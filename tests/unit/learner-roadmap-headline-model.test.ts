import {describe,it,expect} from "vitest";
import {learnerRoadmapHeadline} from "@/modules/courses/learner-roadmap-headline-model";
const base={nextItemTitle:null,itemsMissed:0,itemsCompleted:2,itemsTotal:4};
describe("learner published Learning Path headline",()=>{
 it("does not call unfinished work complete when no next item is selected",()=>{
  expect(learnerRoadmapHeadline(base)).toBe("Review remaining course work");
 });
 it("never hides missed work behind a completion claim",()=>{
  expect(learnerRoadmapHeadline({...base,itemsMissed:1})).toBe("Review missed and incomplete items");
 });
 it("keeps legitimate empty, completed and next item states",()=>{
  expect(learnerRoadmapHeadline({...base,itemsTotal:0})).toBe("No learning items yet");
  expect(learnerRoadmapHeadline({...base,itemsCompleted:4})).toBe("Course work complete");
  expect(learnerRoadmapHeadline({...base,nextItemTitle:"Read notes"})).toBe("Next: Read notes");
 });
});
