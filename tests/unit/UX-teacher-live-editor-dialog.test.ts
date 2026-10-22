import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=()=>readFileSync(join(process.cwd(),"src/components/courses/faculty-live-class-editor.tsx"),"utf8");
describe("Faculty live class authoring overlay UX",()=>{
 it("UX-teacher-live-classes-03 confirms schedule/edit/cancel in a focus-managed shared ConfirmDialog",()=>{
  const page=source();
  expect(page).toContain('import { ConfirmDialog } from "@/components/ui/confirm-dialog"');
  expect(page).toContain("facultyLiveConfirmText(action, chosen");
  expect(page).toContain("onConfirm={()=>void save(true)}");
  expect(page).toContain('confirmVariant={action==="CANCEL"?"danger":"primary"}');
  expect(page).not.toContain("window.confirm");
 });
 it("UX-teacher-live-classes-04 keeps the pending lock and draft values on recoverable errors",()=>{
  const page=source();
  expect(page).toContain("if(!deliveryId||pending||!ready)return");
  expect(page).toContain("setError(e instanceof Error?e.message:");
  expect(page).toContain("finally{setPending(false);setConfirmOpen(false);}");
  expect(page).toContain('<Select value={action}');
  expect(page).toContain('<Input value={title}');
  expect(page).toContain('<Button type="button"');
 });
});
