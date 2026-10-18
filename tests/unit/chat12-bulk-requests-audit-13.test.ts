import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO bulk decisions audit",()=>{
 it("TPO-requests-verification-13 records only authenticated college-scoped requests in the batch",()=>{
  const code=src("src/modules/placements/tpo-request-bulk-audit-service.ts");
  expect(code).toContain('hasMembershipRole(ctx,"TPO")');
  expect(code).toContain("requirePlacementManageScope(ctx,actor.collegeId)");
  expect(code).toContain("eq(placementJobs.collegeId,college.id)");
  expect(code).toContain("rows.length!==input.requestIds.length");
 });
 it("TPO-requests-verification-13 computes real outcomes from authoritative DB statuses, not browser claims",()=>{
  const code=src("src/modules/placements/tpo-request-bulk-audit-service.ts");
  expect(code).toContain('const count=rows.filter(row=>row.status===desired).length');
  expect(code).toContain('eventType:"PLACEMENTS_REQUESTS_BULK_REVIEWED"');
  expect(code).toContain("verifiedCount:count");
  expect(code).toContain("onConflictDoNothing()");
  expect(code).toContain('dedupeKey="tpo-requests-bulk:"');
 });
 it("TPO-requests-verification-13 retries only the same original audit identity, never replays learner decisions",()=>{
  const ui=src("src/components/placements/tpo-request-bulk-decision.tsx");
  const start=ui.indexOf("async function retryAudit()");
  const end=ui.indexOf("async function copyFailed()",start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const retry=ui.slice(start,end);
  expect(retry).toContain('"/api/placements/tpo/requests/bulk-audit"');
  expect(retry).toContain("body:JSON.stringify(auditRetry)");
  expect(retry).not.toContain('"/decision"');
  expect(retry).not.toContain("window.crypto.randomUUID()");
  expect(ui).toContain("const batchAudit={runId,action,requestIds:chosen.map(row=>row.id)}");
  expect(ui).toContain("setAuditRetry(batchAudit)");
  expect(ui).toContain("if(auditRecorded)router.refresh()");
  expect(ui).toContain("Retry batch audit only");
  expect(ui).toContain("auditRetry!==null");
 });
 it("TPO-requests-verification-13 requires CSRF-safe route and truthful partial-failure notice",()=>{
  expect(src("src/app/api/placements/tpo/requests/bulk-audit/route.ts")).toContain("isSameOriginRequest(request)");
  const ui=src("src/components/placements/tpo-request-bulk-decision.tsx");
  expect(ui).toContain("window.crypto.randomUUID()");
  expect(ui).toContain("batch audit could not be confirmed");
  expect(ui).toContain("Some requests were not decided");
 });
});
