import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("MEN-projects-meetings-75 protects meeting requests, scheduling and decision notes",()=>{
 const code=readFileSync(join(process.cwd(),"src/components/projects/project-meeting-controls.tsx"),"utf8");
 expect(code.match(/useProjectEditorDiscardGuard\(/g)?.length).toBe(3);
 expect(code.match(/<ConfirmDialog open=\{guard.discardOpen\}/g)?.length).toBe(3);
 expect(code).toContain("onConfirm={guard.confirmDiscard}");
 expect(code).toContain("Boolean(note.trim())");
 expect(code).not.toContain("onOpenChange={setOpen}");
});
