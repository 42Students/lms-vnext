import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoPrepDueAtUtc} from "@/modules/placements/tpo-prep-due-date";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO preparation deadlines in IST",()=>{
 it("TPO-students-10 converts the selected IST deadline to UTC regardless of the browser timezone",()=>{
  expect(tpoPrepDueAtUtc("2099-12-01T09:30")).toBe("2099-12-01T04:00:00.000Z");
  expect(tpoPrepDueAtUtc("2099-01-01T00:00")).toBe("2098-12-31T18:30:00.000Z");
  const ui=source("src/components/tpo/tpo-students-assign-prep.tsx");
  expect(ui).toContain("tpoPrepDueAtUtc(dueAt)");
  expect(ui).toContain("dueAt:deadline");
  expect(ui).toContain("selection.setSelected");
 });
 it("TPO-students-10 rejects invalid IST dates before the assignment request",()=>{
  expect(tpoPrepDueAtUtc("2099-02-30T10:30")).toBeNull();
  expect(tpoPrepDueAtUtc("2099-13-01T10:30")).toBeNull();
  expect(tpoPrepDueAtUtc("")).toBeNull();
  const service=source("src/modules/placements/tpo-prep-assignment-service.ts");
  expect(service).toContain("eq(collegeMemberships.collegeId,college.id)");
  expect(service).toContain(".onConflictDoNothing()");
  expect(service).toContain("tx.insert(inAppNotifications)");
 });
 it("TPO-students-11 accepts shared readonly selection without mutating it before saving notes",()=>{
  const editor=source("src/components/tpo/tpo-student-note-editor.tsx");
  expect(editor).toContain("membershipIds:readonly string[]");
  expect(editor).toContain("JSON.stringify({membershipIds,note:note.trim()})");
 });
});
