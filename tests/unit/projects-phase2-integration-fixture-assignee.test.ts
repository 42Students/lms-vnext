import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const helper=read("tests/integration/support/projects-review-fixture.ts");
const adversarial=read("tests/integration/projects-adversarial.test.ts");
const suiteFiles=["projects-adversarial.test.ts","projects-p5-lifecycle.test.ts",
  "projects-p6b-final-evaluation.test.ts","projects-p7a-resources-readiness.test.ts"] as const;
describe("Projects Postgres review fixtures require real assignees",()=>{
  it("assigns using the live mutation before submission and review",()=>{
    const start=helper.indexOf("export async function approveProjectTaskThroughReview");
    const relevant=helper.slice(start);
    expect(relevant.indexOf("await assignProjectTaskToLearner("))
      .toBeLessThan(relevant.indexOf("await submitProjectTask("));
    expect(helper).toContain("expectedUpdatedAt:task.updatedAt.toISOString()");
    expect(helper).toContain("assigneeMembershipId:membershipId");
    expect(helper).not.toContain("learner.membership?.id??null");
  });
  it("assigns direct-submit adversarial race/attention cases and still tests unassigned denial",()=>{
    expect(adversarial).toContain('submissionUrl:"https://example.com/unassigned-task"');
    expect(adversarial).toContain('code:"PROJECT_TASK_SUBMISSION_ACCESS_DENIED"');
    expect(adversarial.match(/await assignProjectTaskToLearner\(/g)?.length).toBe(2);
  });
  it.each(suiteFiles)("keeps real learner submit+mentor review in %s",(file)=>{
    expect(read("tests/integration/"+file)).toContain("approveProjectTaskThroughReview");
  });
});
