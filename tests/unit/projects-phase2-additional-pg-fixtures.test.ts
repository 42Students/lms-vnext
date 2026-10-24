import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(new URL("../integration/"+file,import.meta.url),"utf8");
describe("PR-S2-03 integration fixtures across project features",()=>{
  it("P6A assigns before all three lifecycle/review cases",()=>{
    expect((read("projects-p6a-task-submissions.test.ts").match(/await assignProjectTaskToLearner\(/g)??[]).length)
      .toBeGreaterThanOrEqual(3);
  });
  it("Mentor board history and Faculty review both use task assignees",()=>{
    for(const file of ["mentor-board-health.test.ts","faculty-mentor-positive-projects.test.ts"]){
      expect(read(file).match(/await assignProjectTaskToLearner\(/g)).toHaveLength(2);
    }
  });
});
