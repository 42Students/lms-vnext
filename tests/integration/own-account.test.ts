import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { getOwnAccountSummary } from "@/modules/people/own-account-service";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Own-account tests require a disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: databaseUrl, max: 2 });

const RUN = randomUUID().slice(0, 8);
const created: { userId: string; membershipId: string | null }[] = [];

async function person(opts: {
  roles?: string[];
  collegeId?: string;
}): Promise<{ userId: string; membershipId: string | null }> {
  const userId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, identity_uid, phone_e164, email, display_name) VALUES ($1,$2,$3,$4,$5)",
    [
      userId,
      `own-${userId}`,
      `+9199${Math.floor(10000000 + Math.random() * 89999999)}`,
      `own-${RUN}-${userId.slice(0, 6)}@example.test`,
      `Own ${RUN}`,
    ],
  );
  let membershipId: string | null = null;
  if (opts.collegeId) {
    membershipId = randomUUID();
    await pool.query(
      "INSERT INTO college_memberships (id,user_id,college_id) VALUES ($1,$2,$3)",
      [membershipId, userId, opts.collegeId],
    );
    for (const role of opts.roles ?? []) {
      await pool.query(
        "INSERT INTO membership_roles (membership_id,role) VALUES ($1,$2)",
        [membershipId, role],
      );
    }
  }
  created.push({ userId, membershipId });
  return { userId, membershipId };
}

const ctx = (
  userId: string,
  membershipId: string | null,
  collegeId: string = SEED_IDS.collegeA,
  systemRoles: RequestContext["user"]["systemRoles"] = [],
): RequestContext => ({
  user: { id: userId, identityUid: `own-${userId}`, platformStatus: "ACTIVE", systemRoles },
  membership: membershipId
    ? {
        id: membershipId,
        collegeId,
        organizationId: SEED_IDS.organization,
        status: "ACTIVE",
        roles: ["COLLEGE_ADMIN"],
      }
    : null,
});

afterAll(async () => {
  for (const c of created.reverse()) {
    if (c.membershipId) {
      await pool.query("DELETE FROM membership_roles WHERE membership_id=$1", [c.membershipId]);
      await pool.query("DELETE FROM college_memberships WHERE id=$1", [c.membershipId]);
    }
    await pool.query("DELETE FROM users WHERE id=$1", [c.userId]);
  }
  await pool.end();
  await closeDatabaseConnection();
});

describe("own account summary", () => {
  it("describes the caller's name, contacts, college and roles", async () => {
    const p = await person({ collegeId: SEED_IDS.collegeA, roles: ["COLLEGE_ADMIN", "FACULTY"] });
    const summary = await getOwnAccountSummary(ctx(p.userId, p.membershipId));

    expect(summary).not.toBeNull();
    expect(summary!.displayName).toBe(`Own ${RUN}`);
    expect(summary!.phoneE164).toMatch(/^\+9199/);
    expect(summary!.email).toContain("@example.test");
    expect(summary!.college?.name).toBeTruthy();
    expect(summary!.college?.organizationName).toBeTruthy();
    expect(summary!.roles.sort()).toEqual(["COLLEGE_ADMIN", "FACULTY"]);
    expect(summary!.isSuperAdmin).toBe(false);
  });

  it("works for a person with no college selected", async () => {
    const p = await person({});
    const summary = await getOwnAccountSummary(ctx(p.userId, null, SEED_IDS.collegeA, ["SUPER_ADMIN"]));
    expect(summary!.college).toBeNull();
    expect(summary!.roles).toEqual([]);
    expect(summary!.isSuperAdmin).toBe(true);
  });

  it("never describes anyone but the caller, even with another person's membership id", async () => {
    const mine = await person({ collegeId: SEED_IDS.collegeA, roles: ["LEARNER"] });
    const theirs = await person({ collegeId: SEED_IDS.collegeB, roles: ["COLLEGE_ADMIN"] });

    // A context that pairs my user with THEIR membership resolves no college
    // or roles, because the membership must belong to the same user.
    const forged = await getOwnAccountSummary(ctx(mine.userId, theirs.membershipId, SEED_IDS.collegeB));
    expect(forged!.displayName).toBe(`Own ${RUN}`);
    expect(forged!.college).toBeNull();
    expect(forged!.roles).toEqual([]);
  });

  it("returns null for an unknown user", async () => {
    expect(await getOwnAccountSummary(ctx(randomUUID(), null))).toBeNull();
  });
});
