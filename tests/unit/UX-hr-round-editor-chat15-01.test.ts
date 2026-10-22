import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("UX-hr-round-editor-chat15-01",()=>{
 it("round create, edit and removal use a native shared modal with keyboard focus and dismiss guards",()=>{
  const s=read("src/components/hr/recruiter-round-inline-editor.tsx");
  expect(s).toContain('import {Dialog} from "@/components/ui/dialog"');
  expect(s).toContain("<Dialog open={open}");
  expect(s).toContain("dismissible={!pending}");
  expect(s).toContain('title={active?"Change round":"Add a round at the end"}');
  expect(s).toContain("if(!next)requestClose()");
  expect(s).not.toContain('role="dialog" aria-modal="true"');
  expect(s).toContain('className="min-h-11');
  expect(s).toContain("<ConfirmActionDialog");
  expect(s).toContain("Results and confirmed slots cannot be removed.");
 });
 it("round writes guard duplicate submission, enforce optimistic round version and keep friendly conflicts",()=>{
  const s=read("src/components/hr/recruiter-round-inline-editor.tsx");
  for(const part of ['if(pending||readOnly)return',"expectedUpdatedAt", "form.set",
    'method:"POST"', "response.status===409",
    "This round changed or has results or slots. Refresh and try again.",
    "Round added. The placement cell will set its date.","Round updated","Round removed"])
    expect(s).toContain(part);
 });
 it("shared Dialog and ScrollCue provide native Escape, labelled title, focus return and conditional fades",()=>{
  const dialog=read("src/components/ui/dialog.tsx");
  const cue=read("src/components/ui/scroll-cue.tsx");
  const exit=read("src/components/ui/use-overlay-exit.ts");
  for(const part of ["dialog.showModal()","dialog.close()","opener.focus()"])
    expect(exit).toContain(part);
  for(const part of ["useOverlayExit(ref, opener, open, 180)",
    "aria-labelledby={titleId}",'onCancel={event', 'axis="y"'])
    expect(dialog).toContain(part);
  expect(cue).toContain('data-scroll-fade="end"');
 });
});
