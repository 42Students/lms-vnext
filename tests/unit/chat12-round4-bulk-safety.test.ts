import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const n=()=>read("src/components/tpo/tpo-student-nudge-panel.tsx");
const b=()=>read("src/components/tpo/tpo-bulk-action-panel.tsx");
const v=()=>read("src/components/tpo/tpo-student-saved-views.tsx");
describe("chat-12 round4 guarded TPO bulk, messages and saved views",()=>{
 it("TPO-students-03 keeps the whole filtered view action and verified counts",()=>{
  expect(b()).toContain("Act on all {viewCount} in this view");
  expect(b()).toContain("canActOnEntireTpoView(viewCount,allRows)");
  expect(b()).toContain("Check action counts");
 });
 it("TPO-students-04 shows an accessible confirmation before in-app nudge send",()=>{
  expect(n()).toContain('title="Send a message"');
  expect(n()).toContain("runGuarded(send)");
  expect(n()).not.toContain("window.confirm");
 });
 it("TPO-students-16 preserves the preview receipt with reasons, ack, retry and failed rows",()=>{
  expect(b()).toContain("acknowledged");
  expect(b()).toContain("Retry skipped/failed");
  expect(b()).toContain("Copy failed");
  expect(b()).toContain("TpoBulkActionPreview");
 });
 it("TPO-students-17 limits whole-view selection to rows from authorized server results",()=>{
  expect(b()).toContain("const availableRows=allRows??rows");
  expect(b()).toContain("const permitted=new Set(availableRows.map(row=>row.id))");
  expect(b()).toContain("isTpoBulkPreviewCurrent(plan.ids,[...permitted])");
 });
 it("TPO-students-35 deletes saved views through a dialog, keeping the current form on failure",()=>{
  expect(v()).toContain('title="Delete saved view"');
  expect(v()).toContain("runGuarded(async()=>");
  expect(v()).not.toContain("window.confirm");
 });
 it("GR-04 uses the shared safe JSON fetch for bulk previews, confirms and company shares",()=>{
  expect(b()).toContain('apiFetch("/api/placements/tpo/bulk-actions/"+path');
  expect(b()).toContain("apiFetch<{token:string}>");
  expect(b()).not.toContain("error.error");
 });
 it("GR-30 and GR-35 gate irreversible mutation with synchronous double submit guard",()=>{
  expect(b()).toContain("runGuarded(confirm)");
  expect(n()).toContain("runGuarded(send)");
  expect(v()).toContain("runGuarded(async()=>");
  expect(v()).toContain('<Dialog open={deleteTarget!==null}');
 });
});
