import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const list=readFileSync("src/app/(authenticated)/college/placements/drives/page.tsx","utf8");
const modal=readFileSync("src/components/placements/college-drive-edit-dialog.tsx","utf8");
describe("chat-12 in-list job editor parity",()=>{
 it("opens the legacy-width draft editor in the Jobs list and preserves full settings",()=>{
  expect(list).toContain('item.status==="DRAFT"');
  expect(list).toContain("<CollegeDriveEditDialog jobId={item.id}");
  expect(modal).toContain('className="max-w-[800px]"');
  expect(modal).toContain('title="Edit Job"');
  expect(modal).toContain("Full job editor");
 });
 it("requires a fresh authorized read, verifies the draft state and protects unsaved edits",()=>{
  expect(modal).toContain('result.status!=="DRAFT"');
  expect(modal).toContain('if(latest.updatedAt!==initial.updatedAt)');
  expect(modal).toContain('method:"PATCH"');
  expect(modal).toContain('role="alertdialog"');
  expect(modal).toContain('role="alert"');
 });
});
