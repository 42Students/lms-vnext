import {describe,expect,it} from "vitest";
import {canonicalLearnerProjectTab} from "@/modules/projects/learner-project-tab-alias-model";
describe("L21-009 meetings alias",()=>{
  it("maps meetings to the authorized team workspace",()=>{
    expect(canonicalLearnerProjectTab("meetings")).toBe("team");
  });
});
describe("L21-008 legacy Project tasks link",()=>{
  it("maps tasks to Board without changing canonical links",()=>{
    expect(canonicalLearnerProjectTab("tasks")).toBe("board");
    expect(canonicalLearnerProjectTab("board")).toBe("board");
    expect(canonicalLearnerProjectTab(null)).toBe("overview");
  });
});
