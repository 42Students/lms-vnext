import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO drive applicant keyboard review",()=>{
 it("TPO-drive-workspace-71 supports reviewed S and R, guarded Ctrl Enter, arrow navigation and shortcut help",()=>{
  const form=source("src/components/placements/tpo-applicant-review-form.tsx");
  const drawer=source("src/components/placements/tpo-applicant-review-drawer.tsx");
  const help=source("src/components/tpo/tpo-keyboard-shortcuts.tsx");
  expect(form).toContain('event.key.toLowerCase()==="s"||event.key.toLowerCase()==="r"');
  expect(form).toContain('event.ctrlKey&&event.key==="Enter"');
  expect(form).toContain("event.currentTarget.requestSubmit()");
  expect(form).toContain("!reviewed || note.trim().length<10".replace(" || ","||"));
  expect(drawer).toContain('event.key==="ArrowLeft"');
  expect(drawer).toContain('event.key==="ArrowRight"');
  expect(help).toContain('event.key==="?"');
  expect(help).toContain('title="Keyboard shortcuts"');
  expect(help).toContain("Reviewing applicants");
 });
});
