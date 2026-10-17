import {describe,it,expect} from "vitest";
import {canTransitionIndependentFinding as can} from "@/modules/bug-tracker/independent-finding-transition-model";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("SA-tenants-modules-47 independent findings lifecycle",()=>{
 it("SA-tenants-modules-47 requires development fix before release and production release before verification",()=>{
  expect(can("CONFIRMED","RELEASED_PROD")).toBe(false);
  expect(can("IN_PROGRESS","FIXED_DEV")).toBe(true);
  expect(can("FIXED_DEV","RELEASED_PROD")).toBe(true);
  expect(can("IN_PROGRESS","VERIFIED","Detailed reason")).toBe(false);
  expect(can("RELEASED_PROD","VERIFIED","Detailed reason")).toBe(true);
  expect(can("RELEASED_PROD","VERIFIED")).toBe(false);
 });
 it("SA-tenants-modules-47 protects terminal reopen, duplicate state, and unchanged status",()=>{
  expect(can("NEW","NEW")).toBe(false);
  expect(can("NEW","DUPLICATE","Reason")).toBe(false);
  expect(can("WONT_FIX","NEW")).toBe(false);
  expect(can("WONT_FIX","NEW","New reproduction evidence")).toBe(true);
  expect(can("VERIFIED","IN_PROGRESS","Production regression")).toBe(true);
  expect(can("VERIFIED","IN_PROGRESS")).toBe(false);
 });
 it("SA-tenants-modules-47 executes transition checks under the tenant-safe row lock",()=>{
  const service=source("src/modules/bug-tracker/independent-audit-findings-service.ts");
  const route=source("src/app/api/tracker/audit-findings/[publicId]/route.ts");
  const view=source("src/components/tracker/independent-finding-actions.tsx");
  expect(service).toContain('for("update")');
  expect(service).toContain("canTransitionIndependentFinding(");
  expect(service).toContain('reason:"INVALID_STATUS_TRANSITION"');
  expect(route).toContain("INVALID_STATUS_TRANSITION");
  expect(route).toContain("422");
  expect(service).toContain('target.status==="DUPLICATE"');
  expect(service).toContain('patch.duplicateOf=null');
  expect(view).toContain("disabled={!canTransitionIndependentFinding");
 });
});
