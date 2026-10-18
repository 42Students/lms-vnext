import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  PLACEMENT_POLICY_FIELDS,
  storedPlacementPolicyValue,
} from "@/modules/placements/platform-placement-policy-model";

describe("SA-PLACEMENT-POLICY-08 corrupt persisted global overrides", () => {
  it("uses default caps rather than accepting invalid persisted numerics", () => {
    for (const field of PLACEMENT_POLICY_FIELDS) {
      for (const stored of [
        undefined, null, "", " ", "NaN", "Infinity", "-Infinity",
        "1e309", "0x10", "01", "=1+2", "2;DROP TABLE overrides",
        String(field.min - 1), String(field.max + 1),
      ]) {
        expect(storedPlacementPolicyValue(field.key, stored),
          field.key + " raw=" + String(stored)).toBe(field.defaultValue);
      }
      expect(storedPlacementPolicyValue(field.key, String(field.defaultValue)),
        field.key).toBe(field.defaultValue);
    }
    expect(storedPlacementPolicyValue("placement.lowConversionThreshold", "0.25")).toBe(0.25);
    expect(storedPlacementPolicyValue("placement.lowConversionThreshold", "0.255")).toBe(0.15);
    expect(storedPlacementPolicyValue("placement.lowConversionThreshold", " 0.40 ")).toBe(0.4);
    expect(storedPlacementPolicyValue("interview.durationMaxMinutes", "1440")).toBe(1440);
    expect(storedPlacementPolicyValue("interview.durationMaxMinutes", "1441")).toBe(480);
    expect(storedPlacementPolicyValue("interview.durationMinMinutes", "13.5")).toBe(15);
  });

  it("uses validated stored values for both the read projection and the other duration in transactional range checks", () => {
    const source=readFileSync("src/modules/placements/platform-placement-policy-service.ts", "utf8");
    expect(source).toContain("storedPlacementPolicyValue(field.key,override?.value)");
    expect(source).toContain("storedPlacementPolicyValue(otherKey,other?.value)");
    expect(source).toContain("if(minimum>maximum)throw new PlatformPlacementPolicyValidationError()");
    expect(source).toContain("pg_advisory_xact_lock(42, 130038)");
    expect(source).toContain('assertPersistedPlatformPermission(tx,context,"admin-scope.select")');
    expect(source).not.toContain("other?Number(other.value):defaultOther");
    expect(source).not.toContain("Number(override.value)");
  });
});
