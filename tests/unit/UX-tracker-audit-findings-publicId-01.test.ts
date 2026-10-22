import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-tracker-audit-findings-publicId-01",()=>{
 it("preserves canonical route, scoped data and the audited mobile/action states",()=>{
  const source=read("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  expect(source).toContain("getIndependentAuditFinding");
  expect(source).toContain("if(!finding)notFound();");
  expect(source).toContain("<PageHeader");
  expect(source).toContain("<IndependentFindingActions");
  expect(source).toContain("<IndependentFindingCopyAction");
  expect(source).toContain('<PageBackLink href="/tracker/audit-findings" label="Back to audit findings"/>');
  expect(source).toContain("min-h-11");
  expect(source).toContain("focus-visible:outline-2");
  expect(source).toContain("Audit event history");
 });
});
