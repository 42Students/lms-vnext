import {describe,expect,it} from "vitest";
import {summarizeLearnerProjectProgress} from "@/modules/projects/learner-project-progress-model";
describe("L20-013 learner project progress",()=>{
  it("uses only DONE and a real denominator, without foreign project rows",()=>{
    expect(summarizeLearnerProjectProgress(["mine","empty"],[
      {projectId:"mine",status:"DONE"},{projectId:"mine",status:"BLOCKED"},
      {projectId:"mine",status:"IN_PROGRESS"},{projectId:"foreign",status:"DONE"},
    ])).toEqual([
      {projectId:"mine",totalTasks:3,completedTasks:1,blockedTasks:1,percentage:33},
      {projectId:"empty",totalTasks:0,completedTasks:0,blockedTasks:0,percentage:null},
    ]);
  });
});
