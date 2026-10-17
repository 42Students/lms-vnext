import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
const code=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
it("MEN-projects-meetings-75 keeps task edit and delivery reopen drafts until confirmed",()=>{
 const task=code("src/components/projects/mentor-task-details-edit.tsx");
 const reopen=code("src/components/projects/project-delivery-reopen-control.tsx");
 for(const value of [task,reopen]){
  expect(value).toContain("useProjectEditorDiscardGuard(");
  expect(value).toContain("guard.requestClose()");
  expect(value).toContain("<ConfirmDialog open={guard.discardOpen}");
  expect(value).toContain("onConfirm={guard.confirmDiscard}");
  expect(value).not.toContain("onOpenChange={setOpen}");
 }
 expect(task).toContain("if(!next&&!pending)setOpen(true)");
 expect(reopen).toContain("Boolean(reason.trim())");
});
