import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import {
  getSuperAdminCollegeModuleAccess,
  listSuperAdminFeatureControls,
} from "@/modules/module-access/admin-read-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Module access tests require a disposable TEST_DATABASE_URL");
}

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-super",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("module access admin read against PostgreSQL", () => {
  it("lists the college matrix", async () => {
    const result = await listSuperAdminFeatureControls(superAdmin, {});
    expect(result.items.length).toBeLessThanOrEqual(20);
    for (const item of result.items) expect(item.modules).toHaveLength(3);
  });

  it("executes the descendant override union against the real schema", async () => {
    const detail = await getSuperAdminCollegeModuleAccess(superAdmin, SEED_IDS.collegeA, {});
    expect(detail).not.toBeNull();
    expect(detail!.modules).toHaveLength(3);
    expect(detail!.total).toBeGreaterThanOrEqual(0);
  });

  it("filters descendant override totals and rows by module in PostgreSQL",async()=>{
    const all=await getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{});
    const filtered=await getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{module:"projects"});
    expect(all).not.toBeNull();
    expect(filtered).not.toBeNull();
    expect(filtered!.moduleFilter).toBe("projects");
    expect(filtered!.total).toBeLessThanOrEqual(all!.total);
    expect(filtered!.descendants.every(rule=>rule.module==="projects")).toBe(true);
    await expect(getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{module:"administration"})).rejects.toBeDefined();
    await expect(getSuperAdminCollegeModuleAccess({...superAdmin,user:{...superAdmin.user,systemRoles:[]}},SEED_IDS.collegeA,{module:"projects"})).rejects.toBeDefined();
  });

  it("filters persisted descendant scope and module in the same scoped query",async()=>{
    const result=await getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{scope:"MEMBERSHIP",module:"projects"});
    expect(result).not.toBeNull();
    expect(result!.scopeFilter).toBe("MEMBERSHIP");
    expect(result!.descendants.every(r=>r.scopeType==="MEMBERSHIP"&&r.module==="projects")).toBe(true);
    const locked=await getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{scope:"MEMBERSHIP",module:"projects",locks:"LOCKED"});
    expect(locked).not.toBeNull();
    expect(locked!.descendants.every(row=>row.locked)).toBe(true);
    expect(locked!.total).toBeLessThanOrEqual(result!.total);
    const storedOff=await getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{storedState:"OFF"});
    expect(storedOff).not.toBeNull();
    expect(storedOff!.descendants.every(row=>!row.enabled)).toBe(true);
    await expect(getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{storedState:"UNKNOWN"})).rejects.toBeDefined();
    await expect(getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{locks:"UNKNOWN"})).rejects.toBeDefined();
    await expect(getSuperAdminCollegeModuleAccess(superAdmin,SEED_IDS.collegeA,{scope:"GLOBAL"})).rejects.toBeDefined();
  });

  it("returns null for an unknown college and rejects non-super-admins", async () => {
    expect(await getSuperAdminCollegeModuleAccess(superAdmin, randomUUID(), {})).toBeNull();
    await expect(
      listSuperAdminFeatureControls(
        { ...superAdmin, user: { ...superAdmin.user, systemRoles: [] } },
        {},
      ),
    ).rejects.toBeDefined();
  });
});
