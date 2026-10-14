import {describe,expect,it} from "vitest";
import {learnerBoardTaskSelectionNotice} from "@/modules/projects/learner-board-selection-notice-model";
import {filterLearnerBoardTasks} from "@/modules/projects/learner-project-board-model";
import {findOwnLearnerBoardTask} from "@/modules/projects/learner-board-task-detail-model";
describe("learner Board stale task deep links",()=>{
  it("does not reveal missing task information for invalid values",()=>{
    expect(learnerBoardTaskSelectionNotice("../../other",false)).toBeNull();
    expect(learnerBoardTaskSelectionNotice(undefined,false)).toBeNull();
  });
  it("a direct task link cannot bypass active Board filters",()=>{
    const id="11111111-1111-4111-8111-111111111111";
    const row={id,title:"Hidden task",description:null,priority:"HIGH",status:"DONE",sprintId:id};
    const visible=filterLearnerBoardTasks([row],"",{status:"TODO"});
    expect(findOwnLearnerBoardTask(visible,id)).toBeNull();
    expect(learnerBoardTaskSelectionNotice(id,false)).toContain("Board view");
  });
  it("shows a recoverable generic hint only for an absent valid task id",()=>{
    const id="11111111-1111-4111-8111-111111111111";
    expect(learnerBoardTaskSelectionNotice(id,true)).toBeNull();
    expect(learnerBoardTaskSelectionNotice(id,false)).toContain("unavailable in this Board view");
  });
});
