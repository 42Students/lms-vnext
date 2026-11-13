import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { scopeFromActor } from "@/db/tenant-context";
import { ContextResolutionError, resolveRequestContext } from "@/modules/identity/context-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { deletePerson, insertPerson, person } from "../support/actors";

/**
 * Workspace switching: what a person can make the server believe by sending a membership, a role or an admin scope.
 * Cookies SELECT a workspace; they never GRANT one. Every claim below is one a hostile browser could send.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-scope-and-switching needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const prefix = "sec-swt";
const uid = (p: { user: string }) => `${prefix}-${p.user}`;
const learnerA = person(); // learner in college A
const learnerB = person(); // learner in college B
const noWorkspace = person(); // a user with no membership at all
const multi = person(); // holds two roles in college A
const multiSecondRole = crypto.randomUUID();
const suspended = person();
const disabled = person();
const platformScope = { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB };

async function code(call: Promise<unknown>): Promise<string> {
  try {
    await call;
  } catch (error) {
    expect(error).toBeInstanceOf(ContextResolutionError);
    return (error as ContextResolutionError).code;
  }
  throw new Error("expected the resolver to refuse");
}

describe("workspace switching cannot widen what a person may reach", () => {
  let superAdminUid = "";

  beforeAll(async () => {
    await insertPerson(pool, learnerA, "LEARNER", "SEC-SWT Learner A", SEED_IDS.collegeA, prefix);
    await insertPerson(pool, learnerB, "LEARNER", "SEC-SWT Learner B", SEED_IDS.collegeB, prefix);
    await insertPerson(pool, multi, "LEARNER", "SEC-SWT Multi", SEED_IDS.collegeA, prefix);
    await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'FACULTY')", [multiSecondRole, multi.membership]);
    await insertPerson(pool, suspended, "LEARNER", "SEC-SWT Suspended", SEED_IDS.collegeA, prefix);
    await pool.query("UPDATE college_memberships SET status='SUSPENDED', suspended_at=now() WHERE id=$1", [suspended.membership]);
    await insertPerson(pool, disabled, "LEARNER", "SEC-SWT Disabled", SEED_IDS.collegeA, prefix);
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1", [disabled.user]);
    await pool.query("INSERT INTO users(id,identity_uid,display_name,platform_status) VALUES($1,$2,'SEC-SWT No workspace','ACTIVE')", [noWorkspace.user, uid(noWorkspace)]);
    superAdminUid = (await pool.query("SELECT identity_uid FROM users WHERE id=$1", [SEED_IDS.superAdminUser])).rows[0].identity_uid as string;
  }, 60_000);

  afterAll(async () => {
    try {
      await pool.query("DELETE FROM membership_roles WHERE id=$1", [multiSecondRole]).catch(() => undefined);
      for (const p of [learnerA, learnerB, multi, suspended, disabled]) await deletePerson(pool, p);
      await pool.query("DELETE FROM users WHERE id=$1", [noWorkspace.user]).catch(() => undefined);
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 60_000);

  describe("the membership a person claims", () => {
    it("their own active membership resolves to exactly that college and role", async () => {
      const context = await resolveRequestContext({ identityUid: uid(learnerA), activeMembershipId: learnerA.membership, activeRole: "LEARNER", adminScope: null });
      expect(context.membership?.collegeId).toBe(SEED_IDS.collegeA);
      expect(context.membership?.roles).toEqual(["LEARNER"]);
    });

    it("someone else's membership, in the same or another college, is refused", async () => {
      expect(await code(resolveRequestContext({ identityUid: uid(learnerA), activeMembershipId: learnerB.membership, activeRole: "LEARNER", adminScope: null }))).toBe("MEMBERSHIP_NOT_FOUND");
      expect(await code(resolveRequestContext({ identityUid: uid(learnerB), activeMembershipId: learnerA.membership, activeRole: "LEARNER", adminScope: null }))).toBe("MEMBERSHIP_NOT_FOUND");
      expect(await code(resolveRequestContext({ identityUid: uid(learnerA), activeMembershipId: crypto.randomUUID(), activeRole: null, adminScope: null }))).toBe("MEMBERSHIP_NOT_FOUND");
    });

    it("a suspended membership, a disabled account and an unknown identity are refused", async () => {
      expect(await code(resolveRequestContext({ identityUid: uid(suspended), activeMembershipId: suspended.membership, activeRole: "LEARNER", adminScope: null }))).toBe("MEMBERSHIP_NOT_ACTIVE");
      expect(await code(resolveRequestContext({ identityUid: uid(disabled), activeMembershipId: disabled.membership, activeRole: "LEARNER", adminScope: null }))).toBe("USER_DISABLED");
      expect(await code(resolveRequestContext({ identityUid: "sec-swt-nobody-" + crypto.randomUUID(), activeMembershipId: null, activeRole: null, adminScope: null }))).toBe("USER_NOT_FOUND");
    });
  });

  describe("the role a person claims", () => {
    it("a role they do not hold grants nothing", async () => {
      for (const claimed of ["COLLEGE_ADMIN", "TPO", "FACULTY", "MENTOR"] as const) {
        const context = await resolveRequestContext({ identityUid: uid(learnerA), activeMembershipId: learnerA.membership, activeRole: claimed, adminScope: null });
        expect(context.membership?.roles, claimed).toEqual([]);
      }
    });

    it("a person with two roles gets exactly the one they select, and never both or a guess", async () => {
      const asLearner = await resolveRequestContext({ identityUid: uid(multi), activeMembershipId: multi.membership, activeRole: "LEARNER", adminScope: null });
      const asFaculty = await resolveRequestContext({ identityUid: uid(multi), activeMembershipId: multi.membership, activeRole: "FACULTY", adminScope: null });
      const unselected = await resolveRequestContext({ identityUid: uid(multi), activeMembershipId: multi.membership, activeRole: null, adminScope: null });
      expect(asLearner.membership?.roles).toEqual(["LEARNER"]);
      expect(asFaculty.membership?.roles).toEqual(["FACULTY"]);
      expect(unselected.membership?.roles, "no selection must not silently pick one").toEqual([]);
    });
  });

  describe("the admin scope a person claims", () => {
    it("is dropped for anyone who is not a platform administrator, with or without a workspace", async () => {
      const withWorkspace = await resolveRequestContext({ identityUid: uid(learnerA), activeMembershipId: learnerA.membership, activeRole: "LEARNER", adminScope: platformScope });
      const without = await resolveRequestContext({ identityUid: uid(noWorkspace), activeMembershipId: null, activeRole: null, adminScope: platformScope });
      expect(withWorkspace.adminScope ?? null).toBeNull();
      expect(without.adminScope ?? null).toBeNull();
    });

    it("therefore never decides the college the database isolates them to", async () => {
      const withWorkspace = await resolveRequestContext({ identityUid: uid(learnerA), activeMembershipId: learnerA.membership, activeRole: "LEARNER", adminScope: platformScope });
      const without = await resolveRequestContext({ identityUid: uid(noWorkspace), activeMembershipId: null, activeRole: null, adminScope: platformScope });
      expect(scopeFromActor(withWorkspace as never).collegeId).toBe(SEED_IDS.collegeA);
      expect(scopeFromActor(without as never).collegeId).toBeNull();
    });

    it("a platform administrator who has not entered a college keeps the scope they selected", async () => {
      const context = await resolveRequestContext({ identityUid: superAdminUid, activeMembershipId: null, activeRole: null, adminScope: platformScope });
      expect(context.adminScope).toEqual(platformScope);
      const derived = scopeFromActor(context as never);
      expect(derived.platform).toBe(true);
      expect(derived.collegeId).toBe(SEED_IDS.collegeB);
    });
  });
});
