import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO batch decision success and undo action",()=>{
 it("TPO-batches-25 displays server-issued Undo for saved learner and whole batch decisions",()=>{
  const learner=source("src/components/tpo/tpo-batch-inline-decision.tsx");
  const batch=source("src/components/tpo/tpo-batch-decision-control.tsx");
  const page=source("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx");
  for(const text of [learner,batch]){
   expect(text).toContain("setActionId(");
   expect(text).toContain("<TpoBatchUndoControl batchId={batchId} actionId={actionId}/>");
   expect(text).toContain("No decision change was necessary.");
   expect(text).toContain("decision(s)");
  }
  expect(learner).toContain("result.changed?result.actionId??null:null");
  expect(batch).toContain("body.actionId??null:null");
  expect(page).toContain("<TpoBatchInlineDecision membershipId={s.membershipId} batchId={batchId}");
  expect(page).not.toContain('key={s.membershipId+":"+(s.direct.updatedAt??"none")}');
  const route=source("src/app/api/placements/tpo/batches/[batchId]/undo/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("undoPlacementParticipation(ctx,");
 });
});
