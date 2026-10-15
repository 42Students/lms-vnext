import {describe,it,expect} from "vitest";
import {deriveProjectExecutionReadiness} from "@/modules/projects/execution-readiness";
import {readFileSync} from "node:fs";
const get=(n:string)=>readFileSync(new URL("../../src/modules/projects/"+n,import.meta.url),"utf8");
const statuses={releaseStatuses:["SHIPPED"],sprintStatuses:["COMPLETED"],taskStatuses:["DONE"]};
describe("PR-S1-01: execution finishes before Mentor-approved closeout",()=>{
  it("allows delivery review while project remains ACTIVE after releases ship",()=>{
    expect(deriveProjectExecutionReadiness({projectStatus:"ACTIVE",...statuses}).complete).toBe(true);
    expect(deriveProjectExecutionReadiness({projectStatus:"PLANNED",...statuses}).complete).toBe(false);
    expect(deriveProjectExecutionReadiness({projectStatus:"ARCHIVED",...statuses}).complete).toBe(false);
    expect(deriveProjectExecutionReadiness({projectStatus:"COMPLETED",...statuses}).complete).toBe(true);
  });
  it("requires nonempty fully completed work in all categories",()=>{
    expect(deriveProjectExecutionReadiness({projectStatus:"ACTIVE",...statuses,sprintStatuses:[]}).complete).toBe(false);
    expect(deriveProjectExecutionReadiness({projectStatus:"ACTIVE",...statuses,taskStatuses:["IN_REVIEW"]}).complete).toBe(false);
  });
  it("checks persisted releases/sprints/tasks inside submission transaction",()=>{
    const source=get("submission-service.ts");
    expect(source).toContain("deriveProjectExecutionReadiness({");
    expect(source).toContain("tx.select({status:projectReleases.status})");
    expect(source).toContain("effectiveProjectSubmissionReady(execution.complete,override.state)");
    expect(get("mentor-closeout-service.ts")).toContain('status:"COMPLETED"');
  });
});
