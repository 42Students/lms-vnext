import {describe,expect,it} from "vitest";
import {resolveLearnerRoadmapFocusFilter} from "@/modules/courses/learner-roadmap-focus-filter-model";
const lesson={id:"own-lesson",items:[{id:"own-assignment",kind:"ASSIGNMENT" as const},{id:"video",kind:"CONTENT" as const}],
  contents:[{id:"video",type:"YOUTUBE"}]};
describe("exact learner Learning Path item navigation",()=>{
  it("reveals a published assignment even when the old URL filter hides it",()=>{
    expect(resolveLearnerRoadmapFocusFilter("resources","own-lesson","own-assignment",[lesson])).toBe("assessments");
  });
  it("reveals an authorized video under the right filter",()=>{
    expect(resolveLearnerRoadmapFocusFilter("assessments","own-lesson","video",[lesson])).toBe("lectures");
  });
  it("does not change filters for forged or missing item IDs",()=>{
    expect(resolveLearnerRoadmapFocusFilter("resources","foreign","video",[lesson])).toBe("resources");
    expect(resolveLearnerRoadmapFocusFilter("resources",null,"video",[lesson])).toBe("resources");
  });
});
