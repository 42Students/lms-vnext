import {describe,it,expect} from "vitest";
import {mentorEstimationUnit,mentorEstimateLabel,mentorEstimateOptions} from "../../src/modules/projects/mentor-estimation-unit-model";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("mentor estimation model",()=>{
 it("MEN-projects-meetings-R09 follows recorded HOURS or POINTS scale and renders units",()=>{
  expect(mentorEstimationUnit("HOURS")).toBe("HOURS");
  expect(mentorEstimationUnit("POINTS")).toBe("POINTS");
  expect(mentorEstimateOptions("POINTS")).toEqual(expect.arrayContaining([1,2,3,5,8,13,21]));
  expect(mentorEstimateOptions("HOURS")).toContain(40);
  expect(mentorEstimateLabel(5,"POINTS")).toBe("5 pts");
  expect(mentorEstimateLabel(4,"HOURS")).toBe("4 hrs");
  expect(mentorEstimateLabel(null,"HOURS")).toBe("Not estimated");
  expect(read("src/components/projects/mentor-task-create.tsx")).toContain("mentorEstimateOptions(estimationUnit)");
  expect(read("src/components/projects/project-workspace.tsx")).toContain("mentorEstimateLabel(task.estimatePoints,workspace.project.estimationUnit)");
  expect(read("src/db/schema/projects.ts")).toContain("estimationUnit:");
 });
});
