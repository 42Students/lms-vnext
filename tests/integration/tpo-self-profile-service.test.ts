import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getOwnTpoProfile } from "@/modules/placements/tpo-self-profile-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TPO profile tests require a disposable TEST_DATABASE_URL");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });

const asTpo = (userId: string, membershipId: string): RequestContext => ({
  user: { id: userId, identityUid: "seed", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: membershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
});

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("TPO self profile against PostgreSQL", () => {
  it("rejects a TPO context whose database membership has no TPO role", async () => {
    // Other suites legitimately grant TPO to the seeded College Admin.
    // Use a fresh LEARNER-only principal so the persisted-role negative
    // remains valid regardless of neighboring integration fixture order.
    const userId = randomUUID();
    const membershipId = randomUUID();
    await pool.query("insert into users(id,identity_uid,display_name) values($1,$2,$3)",
      [userId, "tpo-no-role-" + userId, "TPO denial witness"]);
    try {
      await pool.query("insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
        [membershipId,userId,SEED_IDS.collegeA]);
      await pool.query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",
        [membershipId]);
      await expect(getOwnTpoProfile(asTpo(userId,membershipId))).rejects.toBeDefined();
    } finally {
      await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
      await pool.query("delete from college_memberships where id=$1",[membershipId]);
      await pool.query("delete from users where id=$1",[userId]);
    }
  });

  it("rejects a mismatched user and membership pair", async () => {
    await expect(
      getOwnTpoProfile(asTpo("00000000-0000-4000-8000-000000000000", SEED_IDS.collegeAdminMembership)),
    ).rejects.toBeDefined();
  });
});
