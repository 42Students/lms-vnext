import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=()=>readFileSync(join(process.cwd(),"src/components/courses/faculty-assignment-editor.tsx"),"utf8");
describe("Faculty assignment authoring UX",()=>{
 it("UX-teacher-courses-deliveryId-assignments-manage-03 keeps the unsaved draft selection protected by shared focus trap",()=>{
  const page=source();
  expect(page).toContain('facultyAssignmentSwitchNeedsConfirmation');
  expect(page).toContain('setConfirmation({kind:"SWITCH",id})');
  expect(page).toContain('title={confirmation?.kind==="SWITCH"?"Discard unsaved assignment changes and switch drafts?"');
  expect(page).toContain("<ConfirmDialog");
  expect(page).not.toContain("window.confirm");
 });
 it("UX-teacher-courses-deliveryId-assignments-manage-04 confirms archive with its established consequence copy",()=>{
  const page=source();
  expect(page).toContain('setConfirmation({kind:"ARCHIVE"})');
  expect(page).toContain("facultyAssignmentArchiveWarning(existing.title)");
  expect(page).toContain('confirmVariant={confirmation?.kind==="ARCHIVE"||confirmation?.kind==="SWITCH"?"danger":"primary"}');
  expect(page).toContain('submit("ARCHIVE",true)');
  expect(page).toContain('mutationLock.current=true');
 });
 it("UX-teacher-courses-deliveryId-assignments-manage-05 uses shared accessible authoring controls",()=>{
  const page=source();
  for(const component of ["Button","Input","Select","Textarea"])expect(page).toContain("<"+component);
  expect(page).not.toContain("<button ");
  expect(page).not.toContain("<select ");
  expect(page).not.toContain("text-on-primary");
  expect(page).toContain('<Checkbox label="Publish now"');
 });
});
