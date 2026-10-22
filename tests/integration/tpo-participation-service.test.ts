import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoLearnerParticipation } from "@/modules/placements/tpo-participation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Participation tests require a disposable TEST_DATABASE_URL");
}

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-tpo",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("TPO participation read against PostgreSQL", () => {
  it("denies a learner without exactly one active enrollment", async () => {
    // A fresh learner owned by this test: the shared seed learner may hold an
    // enrollment created by an earlier suite, so it cannot witness "none".
    const ids = { user: randomUUID(), membership: randomUUID(), role: randomUUID() };
    await pool.query(
      "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
      [ids.user, "participation-" + ids.user, "Participation learner"],
    );
    await pool.query(
      "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')",
      [ids.membership, ids.user, SEED_IDS.collegeA],
    );
    await pool.query(
      "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
      [ids.role, ids.membership],
    );
    try {
      await expect(
        getTpoLearnerParticipation(tpo, ids.membership),
      ).rejects.toBeDefined();
    } finally {
      await pool.query("DELETE FROM membership_roles WHERE id=$1", [ids.role]);
      await pool.query("DELETE FROM college_memberships WHERE id=$1", [ids.membership]);
      await pool.query("DELETE FROM users WHERE id=$1", [ids.user]);
    }
  });

  it("denies an unknown membership and a malformed id", async () => {
    await expect(getTpoLearnerParticipation(tpo, randomUUID())).rejects.toBeDefined();
    await expect(getTpoLearnerParticipation(tpo, "not-a-uuid")).rejects.toBeDefined();
  });

  it("denies a TPO of another college", async () => {
    await expect(
      getTpoLearnerParticipation(
        { ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB } },
        SEED_IDS.learnerCollegeAMembership,
      ),
    ).rejects.toBeDefined();
  });
});
