import {describe,expect,it} from "vitest";
import {learnerProjectArchiveState} from "@/modules/projects/learner-project-archive-model";
describe("L20-014 truthful archived Project read-only cue",()=>{
  it("marks archived projects as read-only without confusing completed status",()=>{
    expect(learnerProjectArchiveState("ARCHIVED")).toEqual({
      readOnly:true,label:"Archived · read only",
    });
    expect(learnerProjectArchiveState("COMPLETED")).toEqual({readOnly:false,label:null});
    expect(learnerProjectArchiveState("ACTIVE")).toEqual({readOnly:false,label:null});
  });
});
