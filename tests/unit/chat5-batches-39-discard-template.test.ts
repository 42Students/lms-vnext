import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=()=>readFileSync("src/components/tpo/tpo-batch-eligibility-import.tsx","utf8");
describe("TPO batch eligibility import pending review safety",()=>{
 it("TPO-batches-39 offers an offline CSV template with the exact safe importer fields",()=>{
  const component=src();
  expect(component).toContain('download="eligibility-import-template.csv"');
  expect(component).toContain("studentCode%2Cdecision%2Creason%0A");
  expect(component).toContain("Download a template");
  expect(component).toContain("Choose another file");
  expect(component).toContain("No change");
 });
 it("TPO-batches-39 cannot accidentally discard included rows or review acknowledgement without a confirmation",()=>{
  const component=src();
  expect(component).toContain("setDiscardPending(true)");
  expect(component).toContain('title="Discard import review?"');
  expect(component).toContain('confirmLabel="Discard review"');
  expect(component).toContain("setPreview(null);setSkippedByUser([]);setAcknowledged(false);setPreviewPage(1)");
  expect(component).not.toContain('onClick={()=>{setPreview(null);setSkippedByUser([]);setNotice("Review discarded.');
 });
 it("TPO-batches-R04 blocks changes when unresolved preview errors remain despite otherwise matched rows",()=>{
  const component=src();
  expect(component).toContain("if(unresolved>0)");
  expect(component).toContain("unresolved>0||!acknowledged");
  expect(component).toContain("This changed while you were working. Your import is still here; preview it again.");
 });
});