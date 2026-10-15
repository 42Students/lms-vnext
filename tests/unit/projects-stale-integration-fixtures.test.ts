import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const targets=[
  "projects-adversarial.test.ts",
  "projects-p5-lifecycle.test.ts",
  "projects-p6b-final-evaluation.test.ts",
  "projects-p7a-resources-readiness.test.ts",
];
const source=(name:string)=>readFileSync(new URL("../integration/"+name,import.meta.url),"utf8");
describe("PR-S2-02 stale integration fixture migration",()=>{
  it.each(targets)("%s no longer bypasses the status request schema",name=>{
    const current=source(name);
    expect(current).not.toContain("STALE(chat-11 merge)");
    expect(current).not.toContain("as never");
    expect(current).toContain("approveProjectTaskThroughReview");
  });
  it("exercises the learner submit and mentor approval rather than direct DONE writes",()=>{
    const fixture=readFileSync(new URL("../integration/support/projects-review-fixture.ts",import.meta.url),"utf8");
    expect(fixture).toContain("submitProjectTask(");
    expect(fixture).toContain("reviewProjectTaskSubmission(");
    expect(fixture).toContain('decision:"APPROVED"');
    expect(fixture).toContain("expectedUpdatedAt:submission.updatedAt.toISOString()");
  });
  it("does not mistake shipped releases for Mentor closeout",()=>{
    expect(source("projects-p5-lifecycle.test.ts")).toContain('expect(row?.status).toBe("ACTIVE")');
    expect(source("projects-p7a-resources-readiness.test.ts")).toContain('projectStatus: "ACTIVE"');
  });
});
