import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 adminScopeOutOfSync,encodeAdminScopeCookie,restoreVerifiedAdminScope,
} from "@/auth/admin-scope";

const scopeA={
 organizationId:"a0000000-0000-4000-8000-000000000001",
 collegeId:"a0000000-0000-4000-8000-000000000002",
};
const scopeB={
 organizationId:"b0000000-0000-4000-8000-000000000001",
 collegeId:"b0000000-0000-4000-8000-000000000002",
};
describe("admin scope stale tabs and revocation",()=>{
 it("rejects a stale tab scope and does not recover a cookie outside persisted choices",()=>{
  expect(adminScopeOutOfSync(scopeA,scopeA)).toBe(false);
  expect(adminScopeOutOfSync(scopeA,scopeB)).toBe(true);
  expect(adminScopeOutOfSync(scopeA,null)).toBe(true);
  expect(restoreVerifiedAdminScope(encodeAdminScopeCookie(scopeA),[scopeB])).toBeNull();
  expect(restoreVerifiedAdminScope(encodeAdminScopeCookie(scopeA),[scopeA])).toEqual(scopeA);
  expect(restoreVerifiedAdminScope("college:tampered",[scopeA])).toBeNull();
 });
 it("resolves fresh persisted user and system-role state before honoring the scope",()=>{
  const context=readFileSync("src/modules/identity/context-service.ts","utf8");
  const route=readFileSync("src/app/api/auth/admin-scope/route.ts","utf8");
  const guard=readFileSync("src/modules/permissions/persisted-actor.ts","utf8");
  expect(context).toContain("findUserByIdentityUid(input.identityUid)");
  expect(context).toContain('user.platformStatus !== "ACTIVE"');
  expect(context).toContain("findSystemRoles(user.id)");
  expect(route).toContain('assertPersistedPlatformPermission(tx,context,"admin-scope.select")');
  expect(guard).toContain("systemRoles.role");
  expect(guard).toContain("requirePermission(");
 });
});
