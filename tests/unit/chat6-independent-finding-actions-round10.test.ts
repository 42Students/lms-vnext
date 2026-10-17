import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {independentFindingActionSchema} from "../../src/modules/bug-tracker/independent-finding-actions-model";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Independent audit finding action workflow",()=>{
 it("SA-placements-projects-121 records version-checked finding edits and reason-required terminal statuses",()=>{
  expect(independentFindingActionSchema.safeParse({action:"STATUS",expectedVersion:0,status:"WONT_FIX"}).success).toBe(false);
  expect(independentFindingActionSchema.safeParse({action:"STATUS",expectedVersion:0,status:"WONT_FIX",note:"Not actionable"}).success).toBe(true);
  expect(independentFindingActionSchema.safeParse({action:"FIX_COMMIT",expectedVersion:1,repo:"42Students/lms-vnext",sha:"1a2b3c4"}).success).toBe(true);
  expect(independentFindingActionSchema.safeParse({action:"FIX_COMMIT",expectedVersion:1,repo:"evil/xyz",sha:"1a2b3c4"}).success).toBe(false);
  const svc=src("src/modules/bug-tracker/independent-audit-findings-service.ts");
  for(const s of ["assertPersistedPlatformPermission","input.expectedVersion","eq(db10AuditFindings.version,row.version)","db10AuditFindingEvents","actorUserId:context.user.id","INVALID_DUPLICATE"])expect(svc).toContain(s);
  const route=src("src/app/api/tracker/audit-findings/[publicId]/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  const detail=src("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  expect(detail).toContain("<IndependentFindingActions");
  expect(detail).toContain("Audit event history");
  const client=src("src/components/tracker/independent-finding-actions.tsx");
  for(const v of ["FIX_COMMIT","COMMENT","DUPLICATE","Save details","window.confirm"])expect(client).toContain(v);
 });
});