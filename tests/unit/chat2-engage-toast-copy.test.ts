import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-recruiters-R04 confirmation toasts",()=>{
 it("gives positive feedback after confirmed writes",()=>{
  const table=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
  const detail=readFileSync("src/components/tpo/recruiter-lead-detail-workspace.tsx","utf8");
  expect(table).toContain("Recruiter lead added");
  expect(detail).toContain("setActionToast");
  expect(detail).toContain('role="status"');
 });
});
