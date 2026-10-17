import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("SA-tenants-modules-40 Other stored keys",()=>{
 it("SA-tenants-modules-40 allows audited add and compare-and-remove but not documented key writes",()=>{
  const service=read("src/modules/platform-settings/admin-editor-service.ts");
  expect(service).toContain("addUnlistedTenantSetting");
  expect(service).toContain("removeUnlistedTenantSetting");
  expect(service).toContain("LEGACY_TENANT_SETTING_MAP.has(key)");
  expect(service).toContain('new TenantSettingEditorError("SETTING_STALE")');
  expect(service).toContain('action:"ADDED_UNLISTED"');
  expect(service).toContain('action:"REMOVED_UNLISTED"');
  expect(service).toContain('.for("update")');
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain('?"[redacted]":row.value');
 });
 it("SA-tenants-modules-40 guards create and delete API against cross-origin requests",()=>{
  const route=read("src/app/api/admin/settings/overrides/route.ts");
  for(const handler of ["POST","DELETE"])
   expect(route).toContain("export async function "+handler+"(request:Request)");
  expect((route.match(/if\(!isSameOriginRequest\(request\)\)/g)??[]).length).toBeGreaterThanOrEqual(3);
 });
 it("SA-tenants-modules-40 displays unknown stored keys and wrong-scope warning",()=>{
  const ui=read("src/components/admin/tenant-settings-other-keys.tsx");
  for(const label of ["Other stored keys","Add setting","Remove setting","Never read here","Typos create unused keys"])
   expect(ui).toContain(label);
  expect(ui).toContain("expectedVersion:entry?.version");
  expect(read("src/components/admin/tenant-settings-editor.tsx")).toContain("<OtherTenantSettings");
 });
});
