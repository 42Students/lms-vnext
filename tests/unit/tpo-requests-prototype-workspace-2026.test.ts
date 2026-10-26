import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const file=(path:string)=>readFileSync(path,"utf8");
describe("TPO Students / Requests prototype",()=>{
 it("reads the same authorized college inbox and offers a selected decision workspace",()=>{
  const page=file("src/app/(authenticated)/tpo/requests/page.tsx");
  expect(page).toContain("await requireTpoBatchActor(context)");
  expect(page).toContain("getTpoGlobalRequestsInbox(context,parsed.data)");
  expect(page).toContain("<TpoRequestPrototypeWorkspace rows={data.requests.map");
  expect(page).toContain("selectedId={typeof raw.request");
  expect(page).toContain('title="Advanced request table, exports and additional request tools"');
  expect(page).toContain("TpoRequestBulkDecision");
  expect(page).toContain("TpoSequentialRequestReview");
  expect(page).toContain("TpoSafeCsvDownload");
 });
 it("never defaults to an unrelated request if an explicit record is not in the page",()=>{
  const workspace=file("src/components/tpo/tpo-request-prototype-workspace.tsx");
  expect(workspace).toContain("selectedId?rows.find(row=>row.id===selectedId)??null:rows[0]??null");
  expect(workspace).toContain("No other student's request has been substituted.");
  expect(workspace).toContain('aria-label="Request queue"');
  expect(workspace).toContain('aria-label="Selected request"');
  expect(workspace).toContain('data-testid="tpo.requests.prototype-workspace"');
 });
 it("keeps approval/rejection server-backed and concurrency-safe",()=>{
  const workspace=file("src/components/tpo/tpo-request-prototype-workspace.tsx");
  const control=file("src/components/placements/tpo-request-decision-control.tsx");
  expect(workspace).toContain("TpoRequestDecisionControl requestId={selected.id}");
  expect(workspace).toContain("expectedUpdatedAt={selected.updatedAt.toISOString()}");
  expect(workspace).toContain("selected.status===\"PENDING\"");
  expect(control).toContain("expectedUpdatedAt");
  expect(workspace).not.toContain("Charan Teja");
 });
 it("preserves urgency, pending state, genuine dates and contextual navigation",()=>{
  const workspace=file("src/components/tpo/tpo-request-prototype-workspace.tsx");
  const page=file("src/app/(authenticated)/tpo/requests/page.tsx");
  expect(workspace).toContain('row.urgent?<StatusBadge tone="warning">Urgent</StatusBadge>');
  expect(workspace).toContain("timeZone:\"Asia/Kolkata\"");
  expect(workspace).toContain("selected.contextHref");
  expect(page).toContain("tpoRequestContextLink(row).href");
  expect(page).toContain("row.nextRoundAt??null");
  expect(page).toContain("row.updatedAt");
 });
});
