import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("tracker detail public ID guards",()=>{
 it("validates bug-report public IDs before touching DB10 readiness or service",()=>{
  const code=read("src/app/(authenticated)/tracker/issues/[publicId]/page.tsx");
  expect(code).toContain("trackerPublicIdSchema.safeParse(publicId).success) notFound()");
  expect(code.indexOf("trackerPublicIdSchema.safeParse(publicId)")).toBeLessThan(code.indexOf("trackerAdminRuntimeEnabled()"));
 });
 it("keeps independent audit findings separate from reported issues, with its own scoped ID validation",()=>{
  const page=read("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  expect(page).toContain("getIndependentAuditFinding(");
  expect(page).toContain("IndependentFindingActions");
  expect(page).not.toContain("TrackerIssueDetailPage");
  const service=read("src/modules/bug-tracker/independent-audit-findings-service.ts");
  const start=service.indexOf("export async function getIndependentAuditFinding(");
  const end=service.indexOf("/** CAS-protected",start);
  const detail=service.slice(start,end);
  expect(detail).toContain("requireIndependentFindingAccess(context)");
  expect(detail).toContain("if(!/^[A-Za-z0-9]");
  expect(detail.indexOf("if(!/^[A-Za-z0-9]")).toBeLessThan(detail.indexOf(".select()"));
 });
});
