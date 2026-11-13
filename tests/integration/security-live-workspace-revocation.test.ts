import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import {
  listMembershipChoices,
  resolveRequestContext,
} from "@/modules/identity/context-service";

/**
 * Checklist #41/#42: exercise the live PostgreSQL authorization resolver with
 * a stable identity and workspace selection while access is changed in the DB.
 *
 * The fixture owns both colleges and its user, so tests never archive, suspend
 * or disable shared seed identities. Requires an isolated test database.
 * Browser cookie clearing and deployed-host behaviour are separate checks.
 */
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || process.env.DATABASE_URL !== databaseUrl) {
  throw new Error("Workspace revocation tests require an isolated TEST_DATABASE_URL matching DATABASE_URL");
}
const pool = new Pool({ connectionString: databaseUrl, max: 2 });

type Fixture = {
  userId: string;
  identityUid: string;
  organizationId: string;
  collegeA: string;
  collegeB: string;
  membershipA: string;
  membershipB: string;
};

function newFixture(): Fixture {
  const userId = randomUUID();
  return {
    userId,
    identityUid: "security-revocation-" + userId,
    organizationId: randomUUID(),
    collegeA: randomUUID(),
    collegeB: randomUUID(),
    membershipA: randomUUID(),
    membershipB: randomUUID(),
  };
}

async function seedFixture(f: Fixture) {
  const suffix = f.userId.replaceAll("-", "");
  await pool.query(
    "insert into organizations(id,name,status) values($1,$2,'ACTIVE')",
    [f.organizationId, "Security revocation org " + suffix],
  );
  await pool.query(
    "insert into colleges(id,organization_id,name,code,status) values($1,$2,$3,$4,'ACTIVE'),($5,$2,$6,$7,'ACTIVE')",
    [
      f.collegeA, f.organizationId, "Security revocation A " + suffix,
      "REV-" + suffix + "-A",
      f.collegeB, "Security revocation B " + suffix, "REV-" + suffix + "-B",
    ],
  );
  await pool.query(
    "insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
    [f.userId, f.identityUid],
  );
  await pool.query(
    "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE'),($4,$2,$5,'ACTIVE')",
    [f.membershipA, f.userId, f.collegeA, f.membershipB, f.collegeB],
  );
  await pool.query(
    "insert into membership_roles(membership_id,role) values($1,'LEARNER'),($2,'FACULTY')",
    [f.membershipA, f.membershipB],
  );
}

async function cleanupFixture(f: Fixture) {
  const membershipIds = [f.membershipA, f.membershipB];
  await pool.query(
    "delete from membership_roles where membership_id = any($1::uuid[])",
    [membershipIds],
  );
  await pool.query(
    "delete from college_memberships where id = any($1::uuid[])",
    [membershipIds],
  );
  await pool.query("delete from users where id=$1", [f.userId]);
  await pool.query(
    "delete from colleges where id = any($1::uuid[])",
    [[f.collegeA, f.collegeB]],
  );
  await pool.query("delete from organizations where id=$1", [f.organizationId]);
}

function selectA(f: Fixture) {
  return resolveRequestContext({
    identityUid: f.identityUid,
    activeMembershipId: f.membershipA,
    activeRole: "LEARNER",
  });
}

function selectB(f: Fixture) {
  return resolveRequestContext({
    identityUid: f.identityUid,
    activeMembershipId: f.membershipB,
    activeRole: "FACULTY",
  });
}

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("live workspace revocation (#41 and #42)", () => {
  it("#41 denies an already-selected archived college and archived organization on the next request", async () => {
    const f = newFixture();
    try {
      await seedFixture(f);

      await expect(selectA(f)).resolves.toMatchObject({
        membership: { id: f.membershipA, roles: ["LEARNER"] },
      });
      await expect(selectB(f)).resolves.toMatchObject({
        membership: { id: f.membershipB, roles: ["FACULTY"] },
      });

      await pool.query(
        "update colleges set status='ARCHIVED',updated_at=clock_timestamp() where id=$1",
        [f.collegeA],
      );
      await expect(selectA(f)).rejects.toMatchObject({
        code: "MEMBERSHIP_NOT_FOUND",
      });
      expect((await listMembershipChoices(f.identityUid)).map(c => c.id))
        .toEqual([f.membershipB]);
      await expect(selectB(f)).resolves.toMatchObject({
        membership: { id: f.membershipB, roles: ["FACULTY"] },
      });

      await pool.query(
        "update colleges set status='ACTIVE',updated_at=clock_timestamp() where id=$1",
        [f.collegeA],
      );
      await expect(selectA(f)).resolves.toMatchObject({
        membership: { id: f.membershipA },
      });

      await pool.query(
        "update organizations set status='ARCHIVED',archived_at=clock_timestamp() where id=$1",
        [f.organizationId],
      );
      await expect(selectA(f)).rejects.toMatchObject({
        code: "MEMBERSHIP_NOT_FOUND",
      });
      await expect(selectB(f)).rejects.toMatchObject({
        code: "MEMBERSHIP_NOT_FOUND",
      });
      expect(await listMembershipChoices(f.identityUid)).toEqual([]);
    } finally {
      await cleanupFixture(f);
    }
  });

  it("#42 denies suspended/ended memberships and a disabled identity without affecting other active colleges", async () => {
    const f = newFixture();
    try {
      await seedFixture(f);
      await expect(selectA(f)).resolves.toHaveProperty("membership.id", f.membershipA);
      await expect(selectB(f)).resolves.toHaveProperty("membership.id", f.membershipB);

      await pool.query(
        "update college_memberships set status='SUSPENDED',suspended_at=clock_timestamp(),suspension_reason='Security revocation test',updated_at=clock_timestamp() where id=$1",
        [f.membershipA],
      );
      await expect(selectA(f)).rejects.toMatchObject({
        code: "MEMBERSHIP_NOT_ACTIVE",
      });
      expect((await listMembershipChoices(f.identityUid)).find(c => c.id === f.membershipA))
        .toMatchObject({ status: "SUSPENDED" });
      await expect(selectB(f)).resolves.toHaveProperty("membership.id", f.membershipB);

      await pool.query(
        "update college_memberships set status='ENDED',suspended_at=null,suspension_reason=null,updated_at=clock_timestamp() where id=$1",
        [f.membershipA],
      );
      await expect(selectA(f)).rejects.toMatchObject({
        code: "MEMBERSHIP_NOT_ACTIVE",
      });
      expect((await listMembershipChoices(f.identityUid)).find(c => c.id === f.membershipA))
        .toMatchObject({ status: "ENDED" });
      await expect(selectB(f)).resolves.toHaveProperty("membership.id", f.membershipB);

      await pool.query(
        "update users set platform_status='DISABLED',updated_at=clock_timestamp() where id=$1",
        [f.userId],
      );
      await expect(selectA(f)).rejects.toMatchObject({ code: "USER_DISABLED" });
      await expect(selectB(f)).rejects.toMatchObject({ code: "USER_DISABLED" });
      await expect(resolveRequestContext({ identityUid: f.identityUid }))
        .rejects.toMatchObject({ code: "USER_DISABLED" });
      await expect(listMembershipChoices(f.identityUid))
        .rejects.toMatchObject({ code: "USER_DISABLED" });
    } finally {
      await cleanupFixture(f);
    }
  });
});
