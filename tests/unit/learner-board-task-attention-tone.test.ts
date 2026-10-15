import {describe,it,expect} from "vitest";
import {learnerBoardTaskStatusTone,learnerBoardTaskPriorityTone} from "@/modules/projects/learner-board-task-attention-tone-model";
describe("learner Project task attention indicators",()=>{
  it("distinguishes blocked from finished work without changing persisted status",()=>{
    expect(learnerBoardTaskStatusTone("BLOCKED")).toBe("warning");
    expect(learnerBoardTaskStatusTone("DONE")).toBe("success");
    expect(learnerBoardTaskStatusTone("IN_REVIEW")).toBe("info");
    expect(learnerBoardTaskStatusTone("UNKNOWN")).toBe("neutral");
  });
  it("highlights critical work without inventing unknown priority",()=>{
    expect(learnerBoardTaskPriorityTone("CRITICAL")).toBe("error");
    expect(learnerBoardTaskPriorityTone("HIGH")).toBe("warning");
    expect(learnerBoardTaskPriorityTone("FORGED")).toBe("neutral");
  });
});
