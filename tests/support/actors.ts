import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * The one place tests build people and request contexts. A `Person` is a user + membership + role-row id triple; a context is
 * what the services receive. Use these instead of writing another `const as = (...)` in a test file.
 */
export type TestRole = "LEARNER" | "FACULTY" | "TPO" | "COLLEGE_ADMIN" | "MENTOR";
export type Person = { user: string; membership: string; role: string };

export const person = (): Person => ({ user: randomUUID(), membership: randomUUID(), role: randomUUID() });

/** Context for a person holding exactly one role in one college (a context carries exactly one selected role). */
export function contextFor(p: Person, role: TestRole, collegeId: string, prefix = "sec"): RequestContext {
  return {
    user: { id: p.user, identityUid: `${prefix}-${p.user}`, platformStatus: "ACTIVE", systemRoles: [] },
    membership: {
      id: p.membership,
      collegeId,
      organizationId: SEED_IDS.organization,
      status: "ACTIVE",
      roles: [role],
    },
  };
}

/** Context for one of the seeded users (their rows already exist in the disposable database). */
export function seedContext(userId: string, membershipId: string, collegeId: string, roles: TestRole[], prefix = "seed"): RequestContext {
  return {
    user: { id: userId, identityUid: `${prefix}-${userId}`, platformStatus: "ACTIVE", systemRoles: [] },
    membership: { id: membershipId, collegeId, organizationId: SEED_IDS.organization, status: "ACTIVE", roles },
  };
}

/** The seeded College Admin of college A: a persisted administrator, so persisted-permission checks accept them. */
export const seededCollegeAdmin = (): RequestContext =>
  seedContext(SEED_IDS.collegeAdminUser, SEED_IDS.collegeAdminMembership, SEED_IDS.collegeA, ["COLLEGE_ADMIN"], "seed-admin");

/** Persist a person (user, active membership, one role). The identity uid matches `contextFor` with the same prefix. */
export async function insertPerson(
  pool: Pool,
  p: Person,
  role: TestRole | string,
  displayName: string,
  collegeId: string,
  prefix = "sec",
): Promise<void> {
  await pool.query("INSERT INTO users(id,identity_uid,display_name,platform_status) VALUES($1,$2,$3,'ACTIVE')", [p.user, `${prefix}-${p.user}`, displayName]);
  await pool.query("INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')", [p.membership, p.user, collegeId]);
  await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,$3)", [p.role, p.membership, role]);
}

/** Best-effort removal of a person created by `insertPerson` (rows kept alive by audit history are left, by design). */
export async function deletePerson(pool: Pool, p: Person): Promise<void> {
  const q = (sql: string, args: unknown[]) => pool.query(sql, args).catch(() => undefined);
  await q("DELETE FROM membership_roles WHERE id=$1", [p.role]);
  await q("DELETE FROM college_memberships WHERE id=$1", [p.membership]);
  await q("DELETE FROM users WHERE id=$1", [p.user]);
}
