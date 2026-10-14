import {describe,expect,it} from "vitest";
import {learnerBoardTaskSelectionNotice} from "@/modules/projects/learner-board-selection-notice-model";
describe("learner Board stale task deep links",()=>{
  it("does not reveal missing task information for invalid values",()=>{
    expect(learnerBoardTaskSelectionNotice("../../other",false)).toBeNull();
    expect(learnerBoardTaskSelectionNotice(undefined,false)).toBeNull();
  });
  it("shows a recoverable generic hint only for an absent valid task id",()=>{
    const id="11111111-1111-4111-8111-111111111111";
    expect(learnerBoardTaskSelectionNotice(id,true)).toBeNull();
    expect(learnerBoardTaskSelectionNotice(id,false)).toContain("no longer available");
  });
});
