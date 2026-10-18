import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { PLACEMENT_POLICY_FIELDS } from "@/modules/placements/platform-placement-policy-model";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ getDb: mocks.getDb }));

import { listPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";

const admin: RequestContext = {
  user: { id: "admin-a", identityUid: "login-a", systemRoles: ["SUPER_ADMIN"], platformStatus: "ACTIVE" },
  // A global policy remains visible while a Super Admin has a college selected.
  adminScope: { organizationId: "organization-a", collegeId: "college-a" },
  membership: null,
};

describe("SA-PLACEMENT-POLICY-07 Super Admin global policy read boundary", () => {
  beforeEach(() => {
    mocks.getDb.mockReset();
  });

  it("rejects a disabled Super Admin and a forged College Admin role before database access", async () => {
    const disabled: RequestContext = {
      ...admin,
      user: { ...admin.user, platformStatus: "DISABLED" },
    };
    const lowerRole: RequestContext = {
      ...admin,
      user: { ...admin.user, systemRoles: [] },
      adminScope: null,
    };
    await expect(listPlatformPlacementPolicy(disabled)).rejects.toThrow();
    await expect(listPlatformPlacementPolicy(lowerRole)).rejects.toThrow();
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("returns only known policy fields, global overrides and explicit version metadata", async () => {
    const where = vi.fn().mockResolvedValue([
      {
        key: "placement.lowConversionThreshold",
        value: "0.25",
        version: 4,
        updatedAt: new Date("2099-01-02T10:00:00.000Z"),
      },
      {
        key: "unrelated.tenant.setting",
        value: "999",
        version: 17,
        updatedAt: new Date("2099-01-03T10:00:00.000Z"),
      },
    ]);
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    mocks.getDb.mockReturnValue({ select });

    const rows = await listPlatformPlacementPolicy(admin);
    expect(rows).toHaveLength(PLACEMENT_POLICY_FIELDS.length);
    expect(rows.map(row => row.key)).toEqual(PLACEMENT_POLICY_FIELDS.map(field => field.key));
    expect(rows.find(row => row.key === "unrelated.tenant.setting")).toBeUndefined();
    expect(rows.find(row => row.key === "placement.lowConversionThreshold")).toMatchObject({
      value: 0.25, version: 4, isOverridden: true,
      updatedAt: "2099-01-02T10:00:00.000Z",
    });
    const fallback = rows.find(row => row.key === "interview.durationMinMinutes");
    expect(fallback).toMatchObject({
      value: 15, isOverridden: false, version: 0, updatedAt: null,
    });
    expect(mocks.getDb).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
  });

  it("SA-PLACEMENT-POLICY-08 rejects finite-but-invalid overrides without losing versions", async () => {
    mocks.getDb.mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [
        {key:"interview.durationMaxMinutes",value:"1000000",version:5,
          updatedAt:new Date("2099-01-02T10:00:00.000Z")},
        {key:"interview.durationMinMinutes",value:"12.5",version:7,
          updatedAt:new Date("2099-01-03T10:00:00.000Z")},
        {key:"placement.lowConversionThreshold",value:"0.255",version:8,
          updatedAt:new Date("2099-01-04T10:00:00.000Z")},
      ] }) }),
    });
    const rows=await listPlatformPlacementPolicy(admin);
    expect(rows.find(row=>row.key==="interview.durationMaxMinutes"))
      .toMatchObject({value:480,isOverridden:true,version:5});
    expect(rows.find(row=>row.key==="interview.durationMinMinutes"))
      .toMatchObject({value:15,isOverridden:true,version:7});
    expect(rows.find(row=>row.key==="placement.lowConversionThreshold"))
      .toMatchObject({value:0.15,isOverridden:true,version:8});
  });

  it("falls back to the documented default instead of displaying a nonfinite stored number", async () => {
    mocks.getDb.mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [
        {key: "interview.durationMaxMinutes", value: "NaN", version: 2, updatedAt: new Date("2099-01-02T10:00:00.000Z")},
      ] }) }),
    });
    const rows = await listPlatformPlacementPolicy(admin);
    expect(rows.find(row => row.key === "interview.durationMaxMinutes")).toMatchObject({
      value: 480, isOverridden: true, version: 2,
    });
  });
});
