import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Mentor and Learner project listings exact dev copy",()=>{
 const filters=readFileSync("src/components/projects/project-participant-list-controls.tsx","utf8");
 const cards=readFileSync("src/components/projects/project-list.tsx","utf8");
 it("keeps the legacy project search and attention empty choice",()=>{
  for(const s of ["Search my projects","Search project title, course or slug","All statuses","Current only","Needs my review","Needs my action","All attention states"]){
    expect(filters).toContain(s);
  }
  expect(filters).toContain("Clear filters");
 });
 it("removes invented uppercase card eyebrow and preserves Open workspace accessibility",()=>{
  expect(cards).not.toContain("Project execution workspace with team");
  expect(cards).not.toContain("Project workspace\n");
  expect(cards).toContain('className="sr-only">Open workspace</span>');
  expect(cards).toContain("emptyTitle");
 });
});
