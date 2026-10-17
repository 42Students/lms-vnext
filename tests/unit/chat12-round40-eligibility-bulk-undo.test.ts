import {it,expect} from "vitest";import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-13 and TPO-students-16 undo eligibility batches only with actor, tenant, 5-min and immutable version proof",()=>{
 const service=src("src/modules/placements/tpo-bulk-students-undo-service.ts");
 const run=src("src/modules/placements/tpo-bulk-action-confirm-service.ts");
 const ui=src("src/components/tpo/tpo-bulk-action-panel.tsx");
 expect(service).toContain("latest.actionId!==row.actionId");
 expect(service).toContain("run.occurredAt.getTime()");
 expect(service).toContain('eq(activityEvents.actorUserId,ctx.user.id)');
 expect(service).toContain('eventKind:"UNDO"');
 expect(service).toContain('"PLACEMENTS_BULK_UNDONE"');
 expect(run).toContain("undoRows:plan.target");
 expect(ui).toContain("Undo last student batch (five minutes)");
 expect(src("src/app/api/placements/tpo/bulk-actions/undo/route.ts")).toContain("isSameOriginRequest(request)");
});