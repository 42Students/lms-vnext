import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("lane-8 TPO stale revalidation keeps failures separate from revoked permissions",()=>{
 it("clears formerly authorized audit data when the persisted grant is denied",()=>{
  const grid=readFileSync("src/components/tpo/tpo-audit-grid.tsx","utf8");
  const denied=grid.indexOf("response.status===401||response.status===403");
  const failure=grid.indexOf('if(!response.ok)throw new Error("Audit revalidation failed")');
  expect(denied).toBeGreaterThan(0);
  expect(failure).toBeGreaterThan(denied);
  expect(grid.slice(denied,failure)).toContain("setSnapshotRows([])");
  expect(grid.slice(denied,failure)).toContain("setSelected([])");
  expect(grid.slice(denied,failure)).toContain("setAccessDenied(true)");
  expect(grid).toContain("Previously loaded audit rows were cleared.");
  expect(grid).toContain("stale && !staleDismissed");
  expect(grid).toContain("Retry audit refresh");
 });
 it("does not swallow revocation as a stale drives refresh",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx","utf8");
  expect(page).toContain('import { AuthorizationError, can } from "@/modules/permissions/policy";');
  expect(page).toContain("if (error instanceof AuthorizationError) throw error;");
  expect(page).toContain('<TpoLifecycleStaleSnapshot key={snapshotKey} failed>');
 });
});
