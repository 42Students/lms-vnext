import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("DB10 independent audit findings detail integration",()=>{
 it("links to its own persisted finding, distinct from the user bug-report workflow",()=>{
  const detail=read("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  const board=read("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  expect(detail).toContain("getIndependentAuditFinding");
  expect(detail).toContain("listIndependentAuditFindingEvents");
  expect(detail).toContain("<IndependentFindingActions");
  expect(detail).toContain("Back to audit findings");
  expect(detail).not.toContain("TrackerIssueDetailPage");
  expect(board).toContain("independentFindingHref");
  expect(board).toContain("getCurrentRequestContext");
  expect(board).toContain("listIndependentAuditFindings");
 });
});
