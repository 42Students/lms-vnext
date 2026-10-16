import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {canActOnEntireTpoView,isTpoBulkPreviewCurrent} from "@/modules/placements/tpo-bulk-ui-model";

describe("TPO-drive-workspace-25 / TPO-students-03 filtered bulk preview",()=>{
 const id=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
 it("keeps a full-view preview visible when selected rows span beyond current page",()=>{
  const allRows=Array.from({length:55},(_,i)=>({id:id(i),label:"Learner "+i}));
  expect(canActOnEntireTpoView(allRows.length,allRows)).toBe(true);
  const selected=allRows.map(row=>row.id);
  expect(isTpoBulkPreviewCurrent(selected,allRows.map(row=>row.id))).toBe(true);
  expect(isTpoBulkPreviewCurrent(selected,allRows.slice(0,25).map(row=>row.id))).toBe(false);
  const panel=readFileSync("src/components/tpo/tpo-bulk-action-panel.tsx","utf8");
  expect(panel).toContain("isTpoBulkPreviewCurrent(plan.ids,[...permitted])?<TpoBulkActionPreview");
 });
 it("loads latest applicant note version before signing an Add a note preview",()=>{
  const service=readFileSync("src/modules/placements/tpo-bulk-action-preview-service.ts","utf8");
  expect(service).toContain('import {listTpoApplicantNotes} from "./applicant-notes-service";');
  expect(service).toContain("await listTpoApplicantNotes(context,plan.jobId!,row.id)");
 });
});
