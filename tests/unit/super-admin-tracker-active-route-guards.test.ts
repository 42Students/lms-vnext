import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(p:string)=>readFileSync(p,"utf8");
const routes=[
 {path:"src/app/(authenticated)/tracker/issues/page.tsx",ready:"trackerAdminRuntimeEnabled()"},
 {path:"src/app/(authenticated)/tracker/issues/[publicId]/page.tsx",ready:"trackerAdminRuntimeEnabled()"},
 {path:"src/app/(authenticated)/tracker/audit-findings/page.tsx",ready:"independentAuditFindingsReady()"},
];
describe("DB10 tracker Super Admin active account route fences",()=>{
 it.each(routes)("checks an active actor before $ready in $path",({path,ready})=>{
  const code=source(path);
  expect(code).toMatch(/platformStatus\s*!==\s*"ACTIVE"/);
  const denial=code.indexOf('redirect("/dashboard")');
  expect(denial).toBeGreaterThan(-1);
  expect(denial).toBeLessThan(code.indexOf(ready));
 });
 it("keeps independent finding detail reads on a distinct Super Admin-scoped service",()=>{
  const code=source("src/modules/bug-tracker/independent-audit-findings-service.ts");
  const gate=code.indexOf("function requireIndependentFindingAccess(");
  const detail=code.indexOf("export async function getIndependentAuditFinding(");
  expect(gate).toBeGreaterThan(-1);
  expect(detail).toBeGreaterThan(gate);
  expect(code.slice(detail,code.indexOf("/** CAS-protected",detail))).toContain("requireIndependentFindingAccess(context)");
 });
});
