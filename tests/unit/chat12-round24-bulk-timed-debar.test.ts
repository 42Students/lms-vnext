import {describe,it,expect} from "vitest";
import {validateTpoBulkDebarDraft} from "@/modules/placements/tpo-bulk-debar-model";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const draft={action:"DEBAR",reason:"Documented policy",untilDate:"2099-06-15",duration:"DATE",untilDrives:"1",count:3};
describe("TPO timed debarment bulk guard",()=>{
 it("TPO-students-06 validates batches, duration and reason before per-learner server writes",()=>{
  expect(validateTpoBulkDebarDraft(draft).ok).toBe(true);
  expect(validateTpoBulkDebarDraft({...draft,count:26}).ok).toBe(false);
  expect(validateTpoBulkDebarDraft({...draft,reason:""}).ok).toBe(false);
  expect(validateTpoBulkDebarDraft({...draft,duration:"DRIVES",untilDrives:"10001"}).ok).toBe(false);
  const ui=src("src/components/tpo/tpo-students-bulk-debar.tsx");
  expect(ui).toContain("useTpoStudentsSelection()");
  expect(ui).toContain('endpoint(learner.id)');
  expect(ui).toContain('action:"LIFT",debarmentId:active[0].id');
  expect(ui).toContain('method:"POST"');
  expect(src("src/app/(authenticated)/tpo/students/page.tsx")).toContain("<TpoStudentsBulkDebar learners=");
 });
 it("TPO-students-07 reports row-level skipped, failed and saved debar/Lift outcomes without exposing reason",()=>{
  const ui=src("src/components/tpo/tpo-students-bulk-debar.tsx");
  expect(ui).toContain('status:"skipped"');
  expect(ui).toContain('status:"failed"');
  expect(ui).toContain('status:"saved"');
  expect(ui).toContain('aria-live="polite"');
 });
});
