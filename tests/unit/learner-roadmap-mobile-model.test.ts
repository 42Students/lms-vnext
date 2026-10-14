import {describe,expect,it} from "vitest";
import {learnerRoadmapMobileOutline} from "@/modules/courses/learner-roadmap-mobile-model";
const rows=[
  {id:"last",name:"Lesson 3",sequence:3,visibleCount:0},
  {id:"first",name:"Lesson 1",sequence:1,visibleCount:2},
  {id:"second",name:"Lesson 2",sequence:2,visibleCount:1},
];
describe("learner mobile roadmap index",()=>{
  it("orders own published lessons and includes empty lesson only on All",()=>{
    expect(learnerRoadmapMobileOutline(rows,"all").map(row=>row.id))
      .toEqual(["first","second","last"]);
    expect(learnerRoadmapMobileOutline(rows,"lectures").map(row=>row.id))
      .toEqual(["first","second"]);
  });
  it("does not invent a lesson or a trackable item for empty data",()=>{
    expect(learnerRoadmapMobileOutline([],"all")).toEqual([]);
    expect(learnerRoadmapMobileOutline([{id:"one",name:"No content",sequence:0,
      visibleCount:0}],"resources")).toEqual([]);
  });
});
