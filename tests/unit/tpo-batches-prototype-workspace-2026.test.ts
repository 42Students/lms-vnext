import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const file=(path:string)=>readFileSync(path,"utf8");
describe("TPO Students / Who is in placements prototype",()=>{
 it("renders an authorized batch table with a selected summary, preserving lifecycle cards",()=>{
  const page=file("src/app/(authenticated)/tpo/batches/page.tsx");
  expect(page).toContain('data-testid="tpo.batches.prototype-workspace"');
  expect(page).toContain('aria-label="Batch placement table"');
  expect(page).toContain('aria-label="Selected batch decision"');
  expect(page).toContain('Advanced batch cards and lifecycle details');
  expect(page).toContain('batchPage.items.map(batch=>');
  expect(page).toContain('batchPage.items.find(batch=>batch.id===raw.selectedBatch)??null');
 });
 it("preserves existing eligibility counts, journey metrics and deep links instead of mock figures",()=>{
  const page=file("src/app/(authenticated)/tpo/batches/page.tsx");
  expect(page).toContain("listTpoBatchCardEligibility(context");
  expect(page).toContain("listTpoBatchJourneyCounts(context");
  expect(page).toContain("eligibility?.get(batch.id)");
  expect(page).toContain("journey?.get(batch.id)");
  expect(page).toContain("tpoBatchNextActionLink(batch,data.ready,counts,progress)");
  expect(page).toContain("tpoBatchNextAction(activeBatch,data.ready,activeSummary,activeJourney)");
  expect(page).not.toContain("Charan Teja");
 });
 it("rejects ambiguous batch selection and never substitutes an unrelated selected batch",()=>{
  const page=file("src/app/(authenticated)/tpo/batches/page.tsx");
  expect(page).toContain('"showOlder","selectedBatch"');
  expect(page).toContain('typeof raw.selectedBatch!=="string"');
  expect(page).toContain('batchPage.items.find(batch=>batch.id===raw.selectedBatch)??null:batchPage.items[0]??null');
  expect(page).toContain("No other batch was selected.");
  expect(page).toContain('href={batchListHref}');
 });
 it("retains existing batch decision and invitation workflows",()=>{
  const page=file("src/app/(authenticated)/tpo/batches/page.tsx");
  const detail=file("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  expect(page).toContain("await requireTpoBatchActor(context)");
  expect(detail).toContain("<TpoBatchLifecycleControl");
  expect(detail).toContain("<TpoBatchInvitationControl");
  expect(detail).toContain("<TpoBatchUndoControl");
 });
});
