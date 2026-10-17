import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("College Admin workspace Team actions",()=>{
 it("COL-projects-15 offers a scoped mentor search and confirmed reassignment modal without changing member roles directly",()=>{
  const dialog=source("src/components/projects/college-project-mentor-dialog.tsx");
  const workspace=source("src/components/projects/project-workspace.tsx");
  expect(workspace).toContain("<CollegeProjectMentorDialog");
  for(const token of ["Reassign mentor","Search mentors","New primary mentor","Role label (optional)","Mentor assigned","Confirm reassignment"])
   expect(dialog).toContain(token);
  expect(dialog).toContain('"/api/projects/reassign-mentor"');
  expect(dialog).toContain("projectIds:[projectId]");
  expect(dialog).toContain("if(lock.current||!mentorId)return");
  expect(dialog).toContain("Your selection has been kept");
  expect(dialog).toContain("role:\"MENTOR\"");
 });
});
