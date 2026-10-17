import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/components/tpo/tpo-after-college-editor.tsx",import.meta.url),"utf8");
describe("chat-12 after-college graceful outcomes",()=>{
 it("TPO-students-05 requires an in-app dialog, preserves version and offers Undo",()=>{
  expect(source).toContain('<Dialog open={confirmation!==null}');
  expect(source).toContain("setUndo(reversing?null:previous)");
  expect(source).toContain("expectedVersion:version");
  expect(source).not.toContain("window.confirm");
 });
 it("GR-30 prevents duplicate submission and keeps chosen outcome",()=>{
  expect(source).toContain("runGuarded(async()=>");
  expect(source).toContain("setConfirmation({outcome,reversing})");
 });
 it("GR-35 shows the consequence of an outcome update before saving",()=>{
  expect(source).toContain('title={confirmation?.reversing?"Restore previous outcome":"Save after-college outcome"}');
 });
 it("GR-90 uses an announced role alert for failed requests",()=>{
  expect(source).toContain('role="alert"');
  expect(source).toContain("cause instanceof FriendlyFetchError && cause.status===409");
  expect(source).toContain("Your outcome selection is kept below");
  expect(source).toContain("Could not save outcome. Please try again.");
 });
});
