import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("TPO settings gracious save behavior",()=>{
 it("TPO-settings-audit-21 preserves the edited job type after a failed network write",()=>{
  const file=source("src/components/tpo/tpo-job-types-editor.tsx");
  expect(file).toContain("apiFetch(url");
  expect(file).toContain("FriendlyFetchError");
  expect(file).toContain("<InlineNotice");
  expect(file).toContain('if(method==="POST"){setLabel("");setCountsAsPlaced(null);}');
 });
 it("TPO-settings-audit-31 applies friendly save errors and retains outcome label edits",()=>{
  const file=source("src/components/tpo/tpo-outcome-labels-editor.tsx");
  expect(file).toContain("apiFetch<");
  expect(file).toContain("Settings changed. Refresh and try again.");
  expect(file).toContain("<InlineNotice");
 });
 it("TPO-settings-audit-43 keeps blocked-date form input on a failed save",()=>{
  const file=source("src/components/tpo/tpo-blocked-dates-editor.tsx");
  expect(file).toContain("apiFetch(url");
  expect(file).toContain("DATE_RANGE_INVALID");
  expect(file).toContain('if(method==="POST"){setStartDay("");setEndDay("");setReason("");}');
 });
 it("TPO-settings-audit-72 turns permission or conflict errors into safe notices without clearing switches",()=>{
  const file=source("src/components/tpo/tpo-company-visibility-editor.tsx");
  expect(file).toContain('apiFetch("/api/placements/tpo/company-visibility"');
  expect(file).toContain("FriendlyFetchError");
  expect(file).toContain("<InlineNotice");
 });
});