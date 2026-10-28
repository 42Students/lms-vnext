import { randomInt, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { closeDatabaseConnection } from "@/db/client";
import { drizzlePeopleRepository } from "@/modules/people/repository";
import type { RequestContext } from "@/modules/identity/context";
import type { MembershipMutationContext } from "@/modules/people/membership-service";

/**
 * DB-004: exercises ACTUAL Drizzle role repository, not synthetic SQL copies.
 * Both the pg fixture pool and the application Drizzle pool must point at the
 * exact same separately provisioned, seeded, disposable PostgreSQL database.
 * Never use DATABASE_URL as a fallback and never run against a live tenant.
 */
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || process.env.DATABASE_URL !== testUrl) {
  throw new Error(
    "DB01 role lock witnesses require explicitly equal TEST_DATABASE_URL and DATABASE_URL in an isolated test database",
  );
}

// This suite mutates and deletes fixture rows, so matching two URLs alone
// must never authorize execution against a production-looking database.
const target = new URL(testUrl);
const database = decodeURIComponent(target.pathname.replace(/^\//, ""));
const testDatabaseName = /^(?:test_[a-z0-9_]+|[a-z0-9_]+_test(?:_[a-z0-9]+)*)$/i;
if (
  !["postgresql:", "postgres:"].includes(target.protocol) ||
  !testDatabaseName.test(database)
) {
  throw new Error("DB01 role lock witnesses require an explicitly named disposable test database");
}
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
if (
  !localHosts.has(target.hostname.toLowerCase()) &&
  process.env.DB01_REMOTE_TEST_DATABASE_CONFIRM !==
    `RESET:${target.hostname.toLowerCase()}/${database}`
) {
  throw new Error("DB01 remote role-lock test target requires exact confirmation");
}

const pool = new Pool({
  connectionString: testUrl,
  max: 4,
  statement_timeout: 10_000,
  query_timeout: 15_000,
});

type Fixture = { userId: string; membershipId: string; identityUid: string };

const actor: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

function mutationFor(fixture: Fixture): MembershipMutationContext {
  const now = new Date();
  return {
    context: actor,
    person: {
      organizationId: SEED_IDS.organization,
      user: {
        id: fixture.userId,
        identityUid: fixture.identityUid,
        phoneE164: null,
        email: null,
        displayName: "DB01 role race fixture",
      },
      membership: {
        id: fixture.membershipId,
        collegeId: SEED_IDS.collegeA,
        status: "ACTIVE", // deliberately stale once membership has ENDED
        suspendedAt: null,
        suspensionReason: null,
        createdAt: now,
        updatedAt: now,
        roles: ["FACULTY"],
      },
    },
  };
}

async function withFixture(run: (f: Fixture) => Promise<void>) {
  const fixture: Fixture = {
    userId: randomUUID(),
    membershipId: randomUUID(),
    identityUid: `db01-role-parent-${randomUUID()}`,
  };

  try {
    await pool.query(
      "insert into users (id, identity_uid, display_name) values ($1, $2, $3)",
      [fixture.userId, fixture.identityUid, "DB01 role fixture"],
    );
    await pool.query(
      `insert into college_memberships (id, user_id, college_id, status)
       values ($1, $2, $3, 'ACTIVE')`,
      [fixture.membershipId, fixture.userId, SEED_IDS.collegeA],
    );
    await pool.query(
      "insert into membership_roles (membership_id, role) values ($1, 'FACULTY')",
      [fixture.membershipId],
    );
    await run(fixture);
  } finally {
    // Only delete rows created by this fixture, never seeded membership rows.
    await pool.query(
      "delete from activity_events where subject_type = 'college_membership' and subject_id = $1",
      [fixture.membershipId],
    );
    await pool.query(
      "delete from membership_roles where membership_id = $1",
      [fixture.membershipId],
    );
    await pool.query("delete from college_memberships where id = $1", [fixture.membershipId]);
    await pool.query("delete from users where id = $1", [fixture.userId]);
  }
}

async function countRole(membershipId: string, role: string): Promise<number> {
  const row = await pool.query<{ count: string }>(
    "select count(*)::text as count from membership_roles where membership_id=$1 and role=$2",
    [membershipId, role],
  );
  return Number(row.rows[0]?.count ?? 0);
}

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB01 parent-lock role mutation against membership END", () => {
  it("denies a grant against ENDED status even with stale authorized input", async () => {
    await withFixture(async (f) => {
      await pool.query(
        "update college_memberships set status='ENDED' where id=$1",
        [f.membershipId],
      );
      await expect(
        drizzlePeopleRepository.addMembershipRole(f.membershipId, "MENTOR", mutationFor(f)),
      ).rejects.toMatchObject({ code: "MEMBERSHIP_ENDED" });
      expect(await countRole(f.membershipId, "MENTOR")).toBe(0);
    });
  });

  it("denies removal against ENDED status despite a stale preflight", async () => {
    await withFixture(async (f) => {
      await pool.query(
        "update college_memberships set status='ENDED' where id=$1",
        [f.membershipId],
      );
      await expect(
        drizzlePeopleRepository.removeMembershipRole(f.membershipId, "FACULTY", mutationFor(f)),
      ).rejects.toMatchObject({ code: "MEMBERSHIP_ENDED" });
      expect(await countRole(f.membershipId, "FACULTY")).toBe(1);
    });
  });

  it("END wins the lock: an in-flight role grant waits then fails closed", async () => {
    await withFixture(async (f) => {
      const endWriter: PoolClient = await pool.connect();
      let transactionOpen = false;
      let inFlightGrant: Promise<{ accepted: true } | { accepted: false; error: unknown }> | null = null;
      try {
        await endWriter.query("BEGIN");
        transactionOpen = true;
        await endWriter.query(
          "update college_memberships set status='ENDED' where id=$1",
          [f.membershipId],
        );

        let settled = false;
        inFlightGrant = drizzlePeopleRepository
          .addMembershipRole(f.membershipId, "MENTOR", mutationFor(f))
          .then(
            () => ({ accepted: true as const }),
            (error: unknown) => ({ accepted: false as const, error }),
          ).finally(() => {
            settled = true;
          });

        // With END holding the parent row lock, the grant cannot complete.
        await new Promise((resolve) => setTimeout(resolve, 120));
        expect(settled).toBe(false);

        await endWriter.query("COMMIT");
        transactionOpen = false;
        const outcome = await inFlightGrant;
        expect(outcome.accepted).toBe(false);
        if (!outcome.accepted) {
          expect(outcome.error).toMatchObject({ code: "MEMBERSHIP_ENDED" });
        }
        expect(await countRole(f.membershipId, "MENTOR")).toBe(0);
      } finally {
        if (transactionOpen) {
          await endWriter.query("ROLLBACK");
        }
        endWriter.release();
        // Settle the repository transaction even when an earlier assertion
        // fails, before fixture teardown can delete this membership.
        if (inFlightGrant) {
          await inFlightGrant;
        }
      }
    });
  });

  it("ACTIVE grants and removals still work and emit activity atomically", async () => {
    await withFixture(async (f) => {
      const mutation = mutationFor(f);
      const added = await drizzlePeopleRepository.addMembershipRole(
        f.membershipId,
        "MENTOR",
        mutation,
      );
      expect(added).toContain("MENTOR");
      expect(await countRole(f.membershipId, "MENTOR")).toBe(1);
      const remaining = await drizzlePeopleRepository.removeMembershipRole(
        f.membershipId,
        "MENTOR",
        mutation,
      );
      expect(remaining).toEqual(["FACULTY"]);
      expect(await countRole(f.membershipId, "MENTOR")).toBe(0);
    });
  });



  it("rejects a stale role-grant snapshot with the wrong canonical user", async () => {
    await withFixture(async (f) => {
      const mutation = mutationFor(f);
      mutation.person.user.id = randomUUID();
      await expect(
        drizzlePeopleRepository.addMembershipRole(f.membershipId, "MENTOR", mutation),
      ).rejects.toMatchObject({ code: "MEMBERSHIP_NOT_FOUND" });
      expect(await countRole(f.membershipId, "MENTOR")).toBe(0);
    });
  });

  it("rejects a stale role-removal snapshot claiming another college", async () => {
    await withFixture(async (f) => {
      const mutation = mutationFor(f);
      mutation.person.membership.collegeId = SEED_IDS.collegeB;
      await expect(
        drizzlePeopleRepository.removeMembershipRole(f.membershipId, "FACULTY", mutation),
      ).rejects.toMatchObject({ code: "MEMBERSHIP_NOT_FOUND" });
      expect(await countRole(f.membershipId, "FACULTY")).toBe(1);
    });
  });

  it("onboarding cannot grant a new role to an ENDED existing membership", async () => {
    await withFixture(async (f) => {
      await pool.query(
        "update college_memberships set status='ENDED' where id=$1",
        [f.membershipId],
      );
      const phoneE164 = `+1${randomInt(2_000_000_000, 9_000_000_000)}`;
      await expect(
        drizzlePeopleRepository.persistPersonMembership(
          {
            identityUid: f.identityUid,
            phoneE164,
            displayName: "DB01 stale onboarding fixture",
            collegeId: SEED_IDS.collegeA,
            roles: ["FACULTY", "MENTOR"],
          },
          { context: actor, organizationId: SEED_IDS.organization },
        ),
      ).rejects.toMatchObject({ code: "MEMBERSHIP_NOT_ACTIVE" });
      expect(await countRole(f.membershipId, "MENTOR")).toBe(0);
      const user = await pool.query<{ phone_e164: string | null }>(
        "select phone_e164 from users where id=$1",
        [f.userId],
      );
      // The identity update performed earlier in the transaction must
      // roll back together with the failed stale-membership role write.
      expect(user.rows[0]?.phone_e164).toBeNull();
    });
  });


  it("denies a cross-college membership rebind rather than permitting stale grants", async () => {
    await withFixture(async (f) => {
      // DB-005 now enforces college ownership at the *database* boundary.
      // An old test that moved a membership to another tenant before checking
      // stale role authority was no longer a valid fixture: the move itself
      // must fail. Preserve the stronger prohibition, and do not grant a role
      // against the foreign college.
      await expect(pool.query(
        "update college_memberships set college_id=$2 where id=$1",
        [f.membershipId, SEED_IDS.collegeB],
      )).rejects.toMatchObject({code:"23514"});
      const current=await pool.query<{college_id:string}>(
        "select college_id from college_memberships where id=$1",
        [f.membershipId],
      );
      expect(current.rows[0]?.college_id).toBe(SEED_IDS.collegeA);
      expect(await countRole(f.membershipId, "MENTOR")).toBe(0);
    });
  });

  it("denies stale onboarding of a suspended existing membership", async () => {
    await withFixture(async (f) => {
      await pool.query(
        `update college_memberships set status='SUSPENDED',
         suspended_at=now(), suspension_reason='DB01 role race test'
         where id=$1`,
        [f.membershipId],
      );
      await expect(
        drizzlePeopleRepository.persistPersonMembership(
          {
            identityUid: f.identityUid,
            phoneE164: `+1${randomInt(2_000_000_000, 9_000_000_000)}`,
            displayName: "DB01 suspended membership fixture",
            collegeId: SEED_IDS.collegeA,
            roles: ["FACULTY", "MENTOR"],
          },
          { context: actor, organizationId: SEED_IDS.organization },
        ),
      ).rejects.toMatchObject({ code: "MEMBERSHIP_NOT_ACTIVE" });
      expect(await countRole(f.membershipId, "MENTOR")).toBe(0);
    });
  });

  it("concurrent removals preserve at least one role on the parent", async () => {
    await withFixture(async (f) => {
      await pool.query(
        "insert into membership_roles (membership_id, role) values ($1, 'MENTOR')",
        [f.membershipId],
      );

      const m = mutationFor(f);
      const outcomes = await Promise.allSettled([
        drizzlePeopleRepository.removeMembershipRole(f.membershipId, "MENTOR", m),
        drizzlePeopleRepository.removeMembershipRole(f.membershipId, "FACULTY", m),
      ]);
      expect(outcomes.filter((x) => x.status === "fulfilled")).toHaveLength(1);
      const failures = outcomes.filter((x) => x.status === "rejected");
      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatchObject({
        reason: expect.objectContaining({ code: "LAST_MEMBERSHIP_ROLE" }),
      });
      const rows = await pool.query(
        "select role from membership_roles where membership_id=$1",
        [f.membershipId],
      );
      expect(rows.rows).toHaveLength(1);
    });
  });
});
