import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("mentor project activity pagination",()=>{
 it("MEN-projects-meetings-60 pages real authorized project history with a stable microsecond cursor",()=>{
  const route=src("src/app/api/projects/[projectId]/activity/route.ts");
  expect(route).toContain("getProjectActivityPage(await getCurrentRequestContext(),projectId");
  expect(route).toContain("last.cursorOccurredAt");
  expect(route).toContain("private, no-store");
  expect(route).toContain("parseLearnerProjectActivityFilters");
  const component=src("src/components/projects/project-activity-filtered-list.tsx");
  expect(component).toContain("Load more activity");
  expect(component).toContain("seen.has(event.id)");
  expect(component).toContain("beforeTime:next.time");
  expect(component).toContain("We couldn't load more activity. Try again.");
  expect(src("src/components/projects/project-workspace.tsx")).toContain("projectId={workspace.project.id} events={workspace.activity}");
 });
});
