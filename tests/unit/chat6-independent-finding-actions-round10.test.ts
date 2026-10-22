import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {independentFindingActionSchema} from "../../src/modules/bug-tracker/independent-finding-actions-model";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Independent audit finding action workflow",()=>{
 it("SA-placements-projects-121 records version-checked finding edits and reason-required terminal statuses",()=>{
  expect(independentFindingActionSchema.safeParse({action:"STATUS",expectedVersion:0,status:"WONT_FIX"}).success).toBe(false);
  expect(independentFindingActionSchema.safeParse({action:"STATUS",expectedVersion:0,status:"WONT_FIX",note:"Not actionable"}).success).toBe(true);
  expect(independentFindingActionSchema.safeParse({action:"FIX_COMMIT",expectedVersion:1,repo:"lms-vnext",sha:"1a2b3c4"}).success).toBe(true);
  expect(independentFindingActionSchema.safeParse({action:"FIX_COMMIT",expectedVersion:1,repo:"evil/xyz",sha:"1a2b3c4"}).success).toBe(false);
  expect(independentFindingActionSchema.safeParse({action:"FIX_COMMIT",expectedVersion:1,repo:"42Students/lms-vnext",sha:"1a2b3c4"}).success).toBe(false);
  const svc=src("src/modules/bug-tracker/independent-audit-findings-service.ts");
  for(const s of ["assertPersistedPlatformPermission","input.expectedVersion","eq(db10AuditFindings.version,row.version)","db10AuditFindingEvents","actorUserId:context.user.id","INVALID_DUPLICATE"])expect(svc).toContain(s);
  expect(svc.indexOf("await tx.insert(db10AuditFindingEvents)")).toBeGreaterThan(svc.indexOf("if(!saved)return {ok:false as const,reason:\"STALE_VERSION\"}"));
  const route=src("src/app/api/tracker/audit-findings/[publicId]/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("DUPLICATE_TARGET_NOT_FOUND");
  expect(svc).toContain('if(!target)return {ok:false as const,reason:"DUPLICATE_TARGET_NOT_FOUND"};');
  const detail=src("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  expect(detail).toContain("<IndependentFindingActions");
  expect(detail).toContain("Audit event history");
  const client=src("src/components/tracker/independent-finding-actions.tsx");
  for(const v of ["FIX_COMMIT","COMMENT","DUPLICATE","<ConfirmDialog","onConfirm={()=>void submit(true)}","if(!confirmed){setConfirmOpen(true);return;}"])expect(client).toContain(v);
  // Each audit action has a descriptive submit label; the same label appears on
  // its action button and version-checked confirmation dialog.
  expect(client).toContain('action==="COMMENT"?"Add comment":action==="STATUS"?"Set to status":');
  expect(client).toContain('action==="DUPLICATE"?"Mark duplicate":"Attach fix commit";');
  expect(client).toContain('>{pending?"Saving…":submitLabel}</Button>');
  expect(client).toContain('confirmLabel={submitLabel} confirmVariant="primary"');
  expect(client).not.toContain("window.confirm(");
 });
});