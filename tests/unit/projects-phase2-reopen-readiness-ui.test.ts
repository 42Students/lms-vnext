import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const legacy=read("docs/audit/legacy-copy-A.md");
const readModel=read("src/modules/projects/readiness-service.ts");
const controls=read("src/components/projects/project-delivery-reopen-control.tsx");
const workspace=read("src/components/projects/project-workspace.tsx");
describe("PR-S2-07 UI and readiness after explicit approved delivery reopen",()=>{
  it("only advertises a new draft after the version's durable reopen event",()=>{
    expect(readModel).toContain("Boolean(latestSubmission.reopenedAt)");
    expect(readModel).toContain("(!finalApproved || deliveryReopened)");
    expect(readModel).toContain("reopened: deliveryReopened");
  });
  it("keeps the exact legacy confirmation and feedback strings",()=>{
    for(const value of ["Reopen for revision","Reopen this submission for revision?",
      "The learner will be able to edit and resubmit it.","Review feedback","Feedback for the learner"])
      expect(legacy).toContain(value);
    expect(controls).toContain('"/reopen","POST"');
    expect(workspace).toContain("!workspace.readiness.finalSubmission.reopened");
    expect(controls).toContain("router.refresh()");
  });
});
