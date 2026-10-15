import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getSuperAdminLearnerAccessTrace } from "@/modules/module-access/admin-trace-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Trace tests require a disposable TEST_DATABASE_URL");
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

describe("module access trace against PostgreSQL", () => {
  it("lists learners of the college", async () => {
    const result = await getSuperAdminLearnerAccessTrace(superAdmin, SEED_IDS.collegeA, {});
    expect(result).not.toBeNull();
  });

  it("queries persisted member overrides without returning other colleges",async()=>{
    const result=await getSuperAdminLearnerAccessTrace(superAdmin,SEED_IDS.collegeA,{overridesOnly:"only"});
    expect(result).not.toBeNull();
    expect(result!.learners.length).toBeLessThanOrEqual(25);
    const locked=await getSuperAdminLearnerAccessTrace(superAdmin,SEED_IDS.collegeA,{overridesOnly:"locked"});
    expect(locked).not.toBeNull();
    expect(locked!.total).toBeLessThanOrEqual(result!.total);
    await expect(getSuperAdminLearnerAccessTrace(superAdmin,SEED_IDS.collegeA,{overridesOnly:"unknown"})).rejects.toBeDefined();
  });

  it("traces a seeded learner of the same college", async () => {
    const result = await getSuperAdminLearnerAccessTrace(superAdmin, SEED_IDS.collegeA, {
      membershipId: SEED_IDS.learnerCollegeAMembership,
    });
    expect(result).not.toBeNull();
  });

  it("does not trace the learner through another college", async () => {
    let outcome: unknown = "unset";
    try {
      outcome = await getSuperAdminLearnerAccessTrace(superAdmin, SEED_IDS.collegeB, {
        membershipId: SEED_IDS.learnerCollegeAMembership,
      });
    } catch (error) {
      outcome = error;
    }
    expect(JSON.stringify(outcome)).not.toContain(SEED_IDS.learnerUser);
  });

  it("returns null for an unknown college and rejects non-super-admins", async () => {
    expect(await getSuperAdminLearnerAccessTrace(superAdmin, randomUUID(), {})).toBeNull();
    await expect(
      getSuperAdminLearnerAccessTrace(
        { ...superAdmin, user: { ...superAdmin.user, systemRoles: [] } },
        SEED_IDS.collegeA,
        {},
      ),
    ).rejects.toBeDefined();
  });
});
