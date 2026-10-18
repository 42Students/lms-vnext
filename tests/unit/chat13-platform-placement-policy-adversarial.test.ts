import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
    const persisted = body.indexOf("await assertPersistedPlatformPermission(tx,context,\"placements.manage\")");
    const rowAccess = body.indexOf("const [existing]=await tx.select()");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(tx).toBeGreaterThanOrEqual(0);
    expect(persisted).toBeGreaterThan(tx);
    expect(rowAccess).toBeGreaterThan(persisted);
    expect(service).toContain('requirePlatformAdministrator(context)');
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
