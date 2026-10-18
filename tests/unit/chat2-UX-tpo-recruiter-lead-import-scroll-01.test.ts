import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("UX-tpo-recruiter-lead-csv-import-01",()=>{
 const get=()=>readFileSync("src/components/tpo/recruiter-lead-csv-import.tsx","utf8");
 it("has focus-managed native Dialog and guarded busy dismiss without a custom tab trap",()=>{
  const s=get();
  expect(s).toContain('<Dialog open={open} onOpenChange={next=>{if(!next)close();}}');
  expect(s).toContain('title="Import recruiter leads" dismissible={!busy}');
  expect(s).not.toContain('role="dialog"');
  expect(s).not.toContain('window.addEventListener("keydown"');
  expect(s).not.toMatch(/max-h-\[90vh\]/);
 });
 it("keeps both preview and result lists with truthfully cued scrolling and explicit empty states",()=>{
  const s=get();
  expect(s).toContain('<ScrollCue axis="y" label="Recruiter import preview rows"');
  expect(s).toContain('<DataTable rows={previewRows}');
  expect(s).toContain("No rows in this group.");
  expect(s).toContain('<ScrollCue axis="y" label="Recruiter import result rows"');
  expect(s).toContain('<DataTable rows={result.results}');
  expect(s).toContain("No import results to display.");
  expect(s).not.toMatch(/<table(?:\s|>)/);
 });
 it("preserves explicit row opt-in, existing-contact exclusion, confirm review, and audit copy",()=>{
  const s=get();
  expect(s).toContain('previewStatus!=="ready"');
  expect(s).toContain('confirmed: true, csv');
  expect(s).toContain("skipRows:[...new Set([...skipRows,...existingNumbers])]");
  expect(s).toContain("setReviewReady(false);setSkipRows");
  expect(s).toContain("Import results");
  expect(s).toContain("staff-attributed audit entry");
  expect(s).toContain('className="inline-flex min-h-11');
 });
});
