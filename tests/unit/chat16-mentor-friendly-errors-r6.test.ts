import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
describe("chat-16 mentor confirmation and safe failure policy",()=>{
 it("MEN-projects-meetings-76 keeps irreversible mutations behind confirmations",()=>{
  const sprint=source("src/components/projects/mentor-sprint-write.tsx");
  const close=source("src/components/projects/mentor-project-closeout-control.tsx");
  const lifecycle=source("src/components/projects/project-lifecycle-actions.tsx");
  const files=source("src/components/projects/project-resource-files-panel.tsx");
  expect(sprint).toContain("title={label+\"?\"}");
  expect(close).toContain('title="Complete this project?"');
  expect(lifecycle).toContain('title={shipped?"Un-ship this release?":"Ship this release?"}');
  expect(files).toContain('confirmLabel="Delete resource"');
  expect(files).not.toContain("window.confirm(");
 });
 it("MEN-projects-meetings-76 never renders arbitrary error messages from task/sprint/file mutations",()=>{
  for(const name of ["mentor-task-details-edit.tsx","mentor-sprint-details-edit.tsx",
    "project-lifecycle-actions.tsx"]){
    const code=source("src/components/projects/"+name);
    expect(code).toContain("caught instanceof FriendlyFetchError".replace("caught",name==="project-lifecycle-actions.tsx"?"error":"caught"));
    expect(code).toContain("friendlyApiError({})");
    expect(code).not.toContain("caught instanceof Error?caught.message");
  }
  const files=source("src/components/projects/project-resource-files-panel.tsx");
  expect(files).toContain("error instanceof FileApiError?error.message:storageErrorMessage(null)");
 });
});
