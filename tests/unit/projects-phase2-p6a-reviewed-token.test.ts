import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../integration/projects-p6a-task-submissions.test.ts",import.meta.url),"utf8");
describe("PR-S2-03 P6A Mentor review accepts current locked version",()=>{
  it("provides the reviewed submission token and explicit mentor confirmation",()=>{
    expect(src).toContain("expectedUpdatedAt: first.updatedAt.toISOString()");
    expect(src).toContain("confirmed: true");
    expect(src).toContain('feedback: "Please tighten the tests."');
  });
});
