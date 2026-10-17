import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-4 college project mentorship bulk reassignment",()=>{
 it("COL-projects-R02 searches all mentors on server and retains bulk evidence",()=>{
  const page=source("src/components/projects/project-admin-reassign-mentor-page.tsx");
  const service=source("src/modules/projects/mentor-reassignment-workload-service.ts");
  const ui=source("src/components/projects/project-mentor-reassignment.tsx");
  expect(page).toContain('name="mentorSearch"');
  expect(page).toContain("{ q: mentorSearch, limit: 100 }");
  expect(page).toContain("Search eligible mentors by name or email");
  expect(service).toContain("mentorName:users.displayName");
  expect(page).toContain("Mentor workload");
  expect(page).toContain("Filter by current mentor");
  expect(page).toContain("isProjectMentorOverloaded");
  expect(ui).toContain("actionableSelection.length");
  expect(ui).toContain('title={"Reassign "+actionableSelection.length+" of "+selected.length');
  expect(ui).toContain("response.failures");
 });
});
