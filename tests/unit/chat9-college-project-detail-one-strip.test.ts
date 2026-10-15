import {describe,expect,it} from "vitest";
import {collegeProjectWorkspaceOwnsTabs,collegeLegacyGroupForPath} from
 "@/modules/people/college-legacy-tabs-model";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("College Projects one tab strip per screen",()=>{
 it("hides list tabs on persisted workspace details only",()=>{
  for(const path of ["/college/projects/111/summary","/college/projects/111/team",
   "/college/projects/111/sprints"])
   expect(collegeProjectWorkspaceOwnsTabs(path),path).toBe(true);
  for(const path of ["/college/projects","/college/projects/at-risk",
   "/college/projects/templates","/college/projects/templates/111",
   "/college/projects/workspaces/new","/college/projects/reassign-mentor"])
   expect(collegeProjectWorkspaceOwnsTabs(path),path).toBe(false);
 });
 it("keeps group navigation on list pages and never hides the workspace inner strip",()=>{
  expect(collegeLegacyGroupForPath("/college/projects/111/summary")?.title).toBe("Projects");
  const src=readFileSync(join(process.cwd(),
   "src/components/college/college-legacy-group-tabs.tsx"),"utf8");
  expect(src).toContain("collegeProjectWorkspaceOwnsTabs(pathname)");
  const detail=readFileSync(join(process.cwd(),
   "src/components/projects/admin-project-section-page.tsx"),"utf8");
  expect(detail).toContain("<ProjectWorkspace");
 });
});
