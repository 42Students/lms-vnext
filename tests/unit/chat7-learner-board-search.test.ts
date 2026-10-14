import { describe, expect, it } from "vitest";
import { filterLearnerBoardTasks } from "@/modules/projects/learner-project-board-model";
const tasks=[
  {id:"1",title:"Implement API",description:"Write authorized read"},
  {id:"2",title:"Mobile board",description:null},
  {id:"3",title:"Regression test",description:"API consistency"},
];
describe("L25-006 learner board search",()=>{
  it("matches title or description case insensitively without mutating the source",()=>{
    expect(filterLearnerBoardTasks(tasks,"api").map(t=>t.id)).toEqual(["1","3"]);
    expect(tasks).toHaveLength(3);
  });
  it("uses all tasks on missing or invalid query and isolates only valid matches",()=>{
    expect(filterLearnerBoardTasks(tasks,undefined)).toHaveLength(3);
    expect(filterLearnerBoardTasks(tasks,"x".repeat(101))).toHaveLength(3);
    expect(filterLearnerBoardTasks(tasks,"NO MATCH")).toEqual([]);
  });
});
