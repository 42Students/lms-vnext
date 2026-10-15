import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {learnerProjectListEmptyState} from "@/modules/projects/learner-project-list-empty-model";
describe("Mentor and Learner project list copy from ProjectsContent.jsx",()=>{
 it("keeps exact Projects title and legacy subtitle without invented role eyebrow",()=>{
  const mentor=readFileSync("src/app/(authenticated)/mentor/projects/page.tsx","utf8");
  const learner=readFileSync("src/app/(authenticated)/learn/projects/page.tsx","utf8");
  for(const source of [mentor,learner]){
    expect(source).toContain('title="Projects"');
    expect(source).toContain("Choose a project to open its workspace.");
    expect(source).not.toContain("DB07 vNext does not yet persist");
  }
  expect(mentor).not.toContain('eyebrow="Mentor"');
 });
 it("renders legacy no-projects and filtered empty labels",()=>{
  expect(learnerProjectListEmptyState(0,0).title).toBe("No projects assigned yet.");
  expect(learnerProjectListEmptyState(4,0).title).toBe("No projects match these filters.");
  expect(learnerProjectListEmptyState(4,2).reason).toBe("HAS_RESULTS");
 });
});
