import {describe,expect,it} from "vitest";
import {findOwnLearnerBoardTask,learnerBoardTaskHref} from "@/modules/projects/learner-board-task-detail-model";
const own="00000000-0000-4000-8000-000000000001";
const foreign="00000000-0000-4000-8000-000000000002";
describe("L25-008 exact learner Board task drawer",()=>{
  it("resolves only a task present in the own scoped workspace",()=>{
    expect(findOwnLearnerBoardTask([{id:own,title:"Own"}],own)).toEqual({id:own,title:"Own"});
    expect(findOwnLearnerBoardTask([{id:own,title:"Own"}],foreign)).toBeNull();
    expect(findOwnLearnerBoardTask([{id:own,title:"Own"}],"bad")).toBeNull();
  });
  it("keeps bounded board state when opening and closing task details",()=>{
    const filters={taskSearch:"API",priority:"HIGH",sprintId:"",releaseId:""};
    expect(learnerBoardTaskHref(own,filters,foreign)).toContain("taskId="+foreign);
    expect(learnerBoardTaskHref(own,filters)).not.toContain("taskId");
    expect(learnerBoardTaskHref(own,filters)).toContain("taskSearch=API");
  });
});
