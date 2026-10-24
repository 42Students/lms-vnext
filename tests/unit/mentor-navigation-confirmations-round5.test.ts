import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("mentor legacy bookmarks and confirmations",()=>{
 it("MEN-projects-meetings-74 safely redirects retired mentor bookmarks",()=>{
  const cfg=source("next.config.ts");
  for(const s of ["/mentor/profile","/mentor/contacts/:path*","/mentor/allQuizzes",
    "/mentor/fileExplorer","/mentor/courses/:path*"])expect(cfg).toContain(s);
  expect(cfg).toContain('destination: "/mentor/projects"');
  // Legacy Mentor links now land in the actual prototype Projects entrypoint.
  expect(cfg).not.toContain('destination: "/mentor"');
 });
 it("MEN-projects-meetings-76 uses styled mentor sprint and project completion confirmation",()=>{
  for(const path of ["src/components/projects/mentor-sprint-write.tsx",
    "src/components/projects/mentor-project-closeout-control.tsx"]){
    const c=source(path);
    expect(c).toContain("<ConfirmDialog");
    expect(c).not.toContain("window.confirm");
  }
  expect(source("src/components/projects/mentor-project-closeout-control.tsx")).toContain("projectMutation(");
 });
 it("MEN-projects-meetings-77 exposes task-scoped state and blocker field labels",()=>{
  const code=source("src/components/projects/mentor-task-status-transition.tsx");
  expect(code).toContain('aria-label={"Next task state for task "+props.taskId}');
  expect(code).toContain('aria-label={"Blocker note for task "+props.taskId}');
  expect(code).not.toContain("window.prompt");
 });
});
