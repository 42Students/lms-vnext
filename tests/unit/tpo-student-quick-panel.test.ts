import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
const id="11111111-1111-4111-8111-111111111111";
describe("TPO-students-02 roster student deep link and drawer",()=>{
 it("accepts exactly one valid student UUID alongside filters, not arbitrary paths or duplicated filters",()=>{
  expect(tpoStudentUrlError({student:id,journeyState:"APPLYING"})).toBeNull();
  expect(tpoStudentUrlError({student:"../foo"})).not.toBeNull();
  expect(tpoStudentUrlError({student:[id,id]})).not.toBeNull();
  expect(tpoStudentUrlError({unsupported:id})).not.toBeNull();
 });
 it("TPO-students-02 keeps learner panel data isolated after quick next/previous navigation",()=>{
  const panel=readFileSync("src/components/tpo/tpo-student-quick-panel.tsx","utf8");
  expect(panel.startsWith('"use client";')).toBe(true);
  expect(panel).toContain("storedDetail?.studentId===student.membershipId");
  expect(panel).toContain("activeLoad.current?.abort()");
  expect(panel).toContain("signal:controller.signal");
  expect(panel).toContain("activeLoad.current!==controller");
  expect(panel).toContain("if(!controller.signal.aborted&&activeLoad.current===controller)");
 });
 it("renders five panel tabs with safe detailed navigation",()=>{
  const page=readFileSync("src/components/tpo/tpo-students-spreadsheet.tsx","utf8");
  const modal=readFileSync("src/components/tpo/tpo-student-quick-panel.tsx","utf8");
  expect(page).toContain("Open student panel");
  expect(page).toContain("q.set(\"student\",id)");
  for(const tab of ["Profile","Placement","Requests","Notes","History"])expect(modal).toContain('"'+tab+'"');
  expect(modal).toContain("if(previous)onNavigate(previous.membershipId)");
  expect(modal).toContain("if(next)onNavigate(next.membershipId)");
  // Shared Drawer renders a native named modal with Escape and focus restoration.
  const drawer=readFileSync("src/components/ui/drawer.tsx","utf8");
  expect(modal).toContain("<Drawer open={true}");
  expect(drawer).toContain("<dialog");
  expect(drawer).toContain("aria-labelledby={titleId}");
  expect(drawer).toContain("useOverlayExit(ref, opener, open, 200)");
  const exit=readFileSync("src/components/ui/use-overlay-exit.ts","utf8");
  expect(exit).toContain("dialog.showModal()");
  expect(exit).toContain("restoreFocus()");
  expect(drawer).toContain("opener.current?.focus()");
  expect(modal).toContain("No attention flags derived");
 });
});
