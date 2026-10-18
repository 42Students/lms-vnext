import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { can } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";
import {
  PLACEMENT_POLICY_FIELDS, placementPolicyValidate, platformPlacementPolicyInput,
} from "@/modules/placements/platform-placement-policy-model";

const source = () => readFileSync("src/modules/placements/platform-placement-policy-service.ts", "utf8");

describe("Super Admin placement policy adversarial boundaries", () => {
  it("SA-PLACEMENT-POLICY-01 rebuilds persisted Super Admin authority inside every write transaction", () => {
    const service = source();
    const start = service.indexOf("export async function setPlatformPlacementPolicy(");
    const body = service.slice(start);
    const tx = body.indexOf("return db.transaction(async tx=>{");
    const persisted = body.indexOf("await assertPersistedPlatformPermission(tx,context,\"admin-scope.select\")");
    const rowAccess = body.indexOf("const [existing]=await tx.select()");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(tx).toBeGreaterThanOrEqual(0);
    expect(persisted).toBeGreaterThan(tx);
    expect(rowAccess).toBeGreaterThan(persisted);
    expect(service).toContain('requirePlatformAdministrator(context)');
  });

  it("SA-PLACEMENT-POLICY-04 allows selected-college Super Admin global policy while denying stale or lower roles", () => {
    const context: RequestContext = {
      user: { id: "sa", identityUid: "sa-id", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
      membership: null,
      adminScope: { collegeId: "college-b", organizationId: "org-b" },
    };
    expect(can(context, "admin-scope.select")).toBe(true);
    expect(can(context, "placements.manage")).toBe(false);
    const sourceText = source();
    expect(sourceText).toContain('assertPersistedPlatformPermission(tx,context,"admin-scope.select")');
    const suspended: RequestContext = { ...context, user: { ...context.user, platformStatus: "DISABLED" } };
    expect(can(suspended, "admin-scope.select")).toBe(false);
    const wrongRole: RequestContext = { ...context, user: { ...context.user, systemRoles: [] } };
    expect(can(wrongRole, "admin-scope.select")).toBe(false);
  });

  it("SA-PLACEMENT-POLICY-02 serializes edits to distinct duration keys before checking their coupled limits", () => {
    const service = source();
    const body = service.split("export async function setPlatformPlacementPolicy")[1] ?? "";
    const lock = body.indexOf("pg_advisory_xact_lock(42, 130038)");
    const existing = body.indexOf("const [existing]=await tx.select()");
    const other = body.indexOf("const [other]=await tx.select(");
    expect(lock).toBeGreaterThanOrEqual(0);
    expect(existing).toBeGreaterThan(lock);
    expect(other).toBeGreaterThan(existing);
    expect(body).toContain("if(minimum>maximum)throw new PlatformPlacementPolicyValidationError()");
    expect(body).toContain("new PlatformPlacementPolicyConflict()");
    expect(body).toContain('.for("update")');
  });

  it("SA-PLACEMENT-POLICY-06 prevents the legacy tenant settings endpoint bypassing the shared duration lock",()=>{
    const policy=source();
    const legacy=readFileSync("src/modules/platform-settings/admin-editor-service.ts","utf8");
    const signature="pg_advisory_xact_lock(42, 130038)";
    expect(policy).toContain(signature);
    expect(legacy).toContain(signature);
    expect(legacy).toContain("placementPolicyValidate(placementPolicy.key,Number(value))");
    expect(legacy).toContain('spec.key==="interview.durationMinMinutes"');
    expect(legacy).toContain('spec.key==="interview.durationMaxMinutes"');
    expect(legacy).toContain('placementPolicyValidate("interview.durationMinMinutes",minimum)');
    expect(legacy).toContain('placementPolicyValidate("interview.durationMaxMinutes",maximum)');
    const fn=legacy.split("export async function saveAdminTenantSettings")[1]?.split("export async function addUnlistedTenantSetting")[0]??"";
    const tx=fn.indexOf("getDb().transaction(async tx=>{");
    const lock=fn.indexOf(signature);
    const roles=fn.indexOf("assertPersistedPlatformPermission(tx,ctx");
    const counterpart=fn.indexOf("const [other]=await tx.select(");
    const write=fn.indexOf("let version=current?.version??0");
    expect(tx).toBeGreaterThanOrEqual(0);
    expect(lock).toBeGreaterThan(tx);
    expect(roles).toBeGreaterThan(lock);
    expect(counterpart).toBeGreaterThan(roles);
    expect(write).toBeGreaterThan(counterpart);
    expect(legacy).toContain("LEGACY_TENANT_SETTING_MAP.has(key)");
    expect(legacy).toContain('new TenantSettingEditorError("INVALID_SETTING")');
  });

  it("SA-PLACEMENT-POLICY-05 atomically audits every persisted global policy write without impersonating a college actor",()=>{
    const svc=source();
    const taxonomy=readFileSync("src/modules/activity/taxonomy.ts","utf8");
    expect(taxonomy).toContain('PLACEMENTS_PLATFORM_POLICY_UPDATED: "placements.platform_policy.updated"');
    expect(taxonomy).toContain("ACTIVITY_EVENT_TYPES.PLACEMENTS_PLATFORM_POLICY_UPDATED");
    expect(svc).toContain('recordActivityEventInTransaction(tx,context,{');
    expect(svc).toContain('eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_PLATFORM_POLICY_UPDATED');
    expect(svc).toContain('subjectType:"platform_setting"');
    expect(svc).toContain("previousVersion:existing?.version??0");
    expect(svc).toContain("nextValue:input.value");
    expect(svc).toContain('if(input.value!==null||existing)');
    const body=svc.split("export async function setPlatformPlacementPolicy")[1]??"";
    expect(body.indexOf("return db.transaction(async tx=>{")).toBeLessThan(
      body.indexOf("recordActivityEventInTransaction(tx,context,{"));
    expect(body.lastIndexOf("recordActivityEventInTransaction(tx,context,{")).toBeLessThan(
      body.lastIndexOf("return {key:input.key"));
    expect(body).not.toContain("actorMembershipId:context.membership");
  });

  it("SA-PLACEMENT-POLICY-03 rejects NaN, infinite or fractional-integer values for every global policy field", () => {
    for (const field of PLACEMENT_POLICY_FIELDS) {
      expect(placementPolicyValidate(field.key,field.defaultValue), field.key).toBe(true);
      for (const bad of [NaN, Infinity, -Infinity, field.min - 1, field.max + 1])
        expect(placementPolicyValidate(field.key,bad), `${field.key}/${bad}`).toBe(false);
      if(field.step === 1)
        expect(placementPolicyValidate(field.key,field.min + 0.5),field.key).toBe(false);
    }
    for(const bad of [
      {key:"placement.lowConversionThreshold",value:NaN,expectedVersion:0},
      {key:"placement.lowConversionThreshold",value:Infinity,expectedVersion:0},
      {key:"placement.lowConversionThreshold",value:1.1,expectedVersion:0},
      {key:"interview.durationMaxMinutes",value:12.5,expectedVersion:0},
      {key:"unknown.policy",value:1,expectedVersion:0},
      {key:"placement.applyRateLimitPerMinute",value:5,expectedVersion:-1},
      {key:"placement.applyRateLimitPerMinute",value:5,expectedVersion:0,other:true},
    ]) expect(platformPlacementPolicyInput.safeParse(bad).success).toBe(false);
    expect(platformPlacementPolicyInput.safeParse({
      key:"placement.lowConversionThreshold",value:0.15,expectedVersion:0,
    }).success).toBe(true);
    expect(platformPlacementPolicyInput.safeParse({
      key:"placement.lowConversionThreshold",value:null,expectedVersion:2,
    }).success).toBe(true);
  });
});
