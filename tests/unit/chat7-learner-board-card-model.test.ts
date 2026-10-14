import {describe,expect,it} from "vitest";
import {learnerBoardCardMetadata} from "@/modules/projects/learner-board-card-model";
describe("L25-007 true Project Board task metadata",()=>{
  it("shows only persisted task priority, status and sprint",()=>{
    expect(learnerBoardCardMetadata({id:"1",title:"Task",status:"IN_PROGRESS",priority:"HIGH",sprintId:"s1"},
      [{id:"s1",title:"Own Sprint"}])).toEqual({
        title:"Task",status:"IN PROGRESS",priority:"HIGH",sprintTitle:"Own Sprint",
    });
    expect(learnerBoardCardMetadata({id:"1",title:"Task",status:"TODO",priority:"LOW",sprintId:"none"},[])
      .sprintTitle).toBe("Unknown sprint");
  });
});
