import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Platform-wide identity safety",()=>{
 it("SA-academics-people-106 blocks or restores a nonprivileged platform account with reason, audit and session revocation",()=>{
  const svc=read("src/modules/people/super-admin-platform-account-service.ts");
  const route=read("src/app/api/admin/people/platform/[userId]/route.ts");
  const page=read("src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx");
  const ui=read("src/components/admin/super-admin-platform-block-action.tsx");
  for(const needle of ["system-role.manage","context.user.id===userId","systemRoles.userId","assertPersistedPlatformPermission","revocation_reason='SUPER_ADMIN_PLATFORM_BLOCK'","recordActivityEventInTransaction","PLATFORM_USER_BLOCKED","PLATFORM_USER_REACTIVATED"])expect(svc).toContain(needle);
  expect(route).toContain("isSameOriginRequest(request)");
  expect(page).toContain("SuperAdminPlatformBlockAction");
  for(const text of ["Block platform account","Reactivate platform account","All active sessions will be revoked immediately.","reason.trim().length<4"])expect(ui).toContain(text);
 });
});