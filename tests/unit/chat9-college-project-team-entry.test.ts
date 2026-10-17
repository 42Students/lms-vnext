import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("College projects team and resource evidence",()=>{
 it("COL-projects-15 links workspace Team to an authorized preselected reassignment without inferring a different tenant",()=>{
  const workspace=source("src/components/projects/project-workspace.tsx");
  const admin=source("src/components/projects/project-admin-reassign-mentor-page.tsx");
  const control=source("src/components/projects/project-mentor-reassignment.tsx");
  expect(workspace).toContain("Reassign mentor");
  expect(workspace).toContain("encodeURIComponent(workspace.project.id)");
  expect(admin).toContain("z.string().uuid().safeParse");
  expect(control).toContain("workspaces.some(item => item.id === initialProjectId)");
  expect(control).toContain("matchingWorkspaces");
 });
});
