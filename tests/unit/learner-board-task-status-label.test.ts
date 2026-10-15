import { describe,expect,it } from "vitest";
import { learnerBoardTaskStatusLabel,learnerBoardTaskPriorityLabel } from "@/modules/projects/learner-board-task-status-label-model";
describe("learner Project task preview vocabulary",()=>{
  it("uses readable persisted task status names",()=>{
    expect(["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"].map(learnerBoardTaskStatusLabel)).toEqual(["To do","In progress","Blocked","In review","Done"]);
  });
  it("uses readable priority, without exposing unknown raw codes",()=>{
    expect(learnerBoardTaskPriorityLabel("CRITICAL")).toBe("Critical");
    expect(learnerBoardTaskPriorityLabel("FORGED")).toBe("Unknown priority");
    expect(learnerBoardTaskStatusLabel("FORGED")).toBe("Unknown status");
  });
});
