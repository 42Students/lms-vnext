import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Recruiter Home Drives round-5 graceful request flows",()=>{
 it("REC-home-drives-49 GR-04 preserves failed bulk results and uses friendly guarded network requests",()=>{
  const value=src("src/components/placements/recruiter-result-controls.tsx");
  expect(value).toContain("bulkSubmissionLock.current=true");
  expect(value).toContain("await apiFetch(");
  expect(value).toContain("failed selections remain checked for retry");
  expect(value).toContain("ConfirmDialog");
 });
 it("REC-home-drives-29 GR-90 preserves unsent draft after an uncertain save result",()=>{
  const value=src("src/components/hr/hr-drive-draft-form.tsx");
  expect(value).toContain("apiFetch(");
  expect(value).toContain("Your draft is preserved; check Drives before resending.");
  expect(value).not.toContain('"Your request was not sent. Please try again. ("+code+")"');
 });
 it("REC-home-drives-12 REC-home-drives-22 GR-35 makes cancellation explicit and recoverable",()=>{
  const value=src("src/components/hr/recruiter-request-cancel-button.tsx");
  expect(value).toContain("ConfirmDialog");
  expect(value).toContain("await apiFetch(");
  expect(value).not.toContain("window.confirm");
  expect(value).toContain("lock.current");
 });
});