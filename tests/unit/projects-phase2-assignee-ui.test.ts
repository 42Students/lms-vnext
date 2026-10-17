import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const get=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("PR-S2-03 visible task ownership assignment",()=>{
  it("provides the legacy Assignee picker wired to registered task-assignee mutation",()=>{
    const form=get("src/components/projects/project-task-assignee-control.tsx");
    const workspace=get("src/components/projects/project-workspace.tsx");
    expect(form).toContain(" to a team member");
    expect(form).toContain('"/assignee"');
    expect(workspace).toContain("assigneeMembershipId={task.assigneeMembershipId}");
    expect(workspace).toContain('member.role==="LEARNER"');
  });
  it("updates DB test fixtures to assign before learner submission",()=>{
    const fixture=get("tests/integration/support/projects-review-fixture.ts");
    expect(fixture.indexOf("await assignProjectTask(")).toBeLessThan(fixture.indexOf("await submitProjectTask("));
  });
});
