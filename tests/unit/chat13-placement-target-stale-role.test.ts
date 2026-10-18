import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isPlacementJobTargetCohort } from "@/modules/placements/cohort-target-policy";

describe("SA-TARGET-REVOKE-07 draft audience scope and stale-authority protection", () => {
  it("checks persisted placement permission under the same transaction as writes", () => {
    const service=readFileSync("src/modules/placements/cohort-target-service.ts","utf8");
    const guard="await assertPersistedPlatformPermission(tx, context, \"placements.manage\", {";
    const lock=".for(\"update\")";
    const mutation="await tx.delete(placementJobCohortTargets)";
    expect(service).toContain("const scopedCollege = await requirePlacementManageScope(context, input.collegeId)");
    expect(service).toContain(guard);
    expect(service).toContain("collegeId: scopedCollege.id, organizationId: scopedCollege.organizationId");
    expect(service.indexOf(guard)).toBeGreaterThan(service.indexOf("return db.transaction(async tx =>"));
    expect(service.indexOf(guard)).toBeLessThan(service.indexOf(lock));
    expect(service.indexOf(lock)).toBeLessThan(service.indexOf(mutation));
    expect(service).toContain('if (job.status !== "DRAFT")');
    expect(service).toContain('eq(departments.collegeId, input.collegeId)');
    expect(service).toContain('if (allowed.length !== input.cohortIds.length)');
  });
  it("keeps live published-drive retargeting fail-closed until notifications are transactional", () => {
    expect(isPlacementJobTargetCohort("cohort-a",[])).toBe(false);
    expect(isPlacementJobTargetCohort(null,["cohort-a"])).toBe(false);
    expect(isPlacementJobTargetCohort("cohort-a",["cohort-a"])).toBe(true);
    const code=readFileSync("src/modules/placements/cohort-target-service.ts","utf8");
    expect(code).toContain("PLACEMENT_JOB_READ_ONLY");
    expect(code).toContain("Changing live targets must notify applicants");
  });
});
