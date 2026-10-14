import {describe,expect,it} from "vitest";
import {learnerProjectListEmptyState} from "@/modules/projects/learner-project-list-empty-model";
describe("L20-016 distinct project list states",()=>{
  it("separates no assignments, filtered empty and actual results",()=>{
    expect(learnerProjectListEmptyState(0,0).reason).toBe("NO_ASSIGNMENTS");
    expect(learnerProjectListEmptyState(3,0).reason).toBe("FILTERED_EMPTY");
    expect(learnerProjectListEmptyState(3,2).reason).toBe("HAS_RESULTS");
  });
  it("never represents a successful populated read as zero projects",()=>{
    expect(learnerProjectListEmptyState(1,1).title).toBe("Projects");
  });
});
