import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Mentor draft recovery",()=>{
 it("MEN-projects-meetings-75 protects task and sprint drafts against dialog dismiss and page unload",()=>{
  const guard=source("src/components/projects/project-editor-discard-guard.ts");
  expect(guard).toContain('window.addEventListener("beforeunload"');
  expect(guard).toContain("if(pending)return;");
  expect(guard).toContain("if(dirty)setDiscardOpen(true)");
  for(const path of ["src/components/projects/mentor-task-create.tsx",
    "src/components/projects/mentor-sprint-write.tsx"]){
    const s=source(path);
    expect(s).toContain("useProjectEditorDiscardGuard(open,dirty,busy,discardDraft)");
    expect(s).toContain("<ConfirmDialog open={guard.discardOpen}");
    expect(s).toContain("onConfirm={guard.confirmDiscard}");
    expect(s).toContain("onClick={guard.requestClose}");
    expect(s).not.toContain('onOpenChange={setOpen}');
  }
 });
});
