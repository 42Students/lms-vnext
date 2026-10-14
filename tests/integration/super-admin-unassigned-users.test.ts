import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listSuperAdminUnassignedUsers } from "@/modules/people/admin-unassigned-user-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "unassigned-fixture", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
describe.skipIf(!enabled)("Global users without memberships (PG)", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("finds unassigned identities with status/role filters, excludes ended memberships, and denies scoped/wrong-role requests", async () => {
    const nonce = randomUUID(), active = randomUUID(), disabled = randomUUID(), assigned = randomUUID();
    await pool!.query("insert into users (id,identity_uid,display_name,platform_status,email) values ($1,$2,$3,'ACTIVE',$4),($5,$6,$7,'DISABLED',null),($8,$9,$10,'ACTIVE',null)",
      [active, "u-a-" + nonce, "Unassigned Active " + nonce, nonce + "@example.test", disabled, "u-d-" + nonce, "Unassigned Disabled " + nonce,
        assigned, "u-m-" + nonce, "Assigned " + nonce]);
    await pool!.query("insert into system_roles (user_id,role) values ($1,'SUPER_ADMIN')", [active]);
    await pool!.query("insert into college_memberships (user_id,college_id,status) values ($1,$2,'ENDED')", [assigned, SEED_IDS.collegeA]);
    const all = await listSuperAdminUnassignedUsers(admin, { q: nonce, page: 999 });
    expect(all.items.map(row => row.id).sort()).toEqual([active, disabled].sort());
    expect(all.page).toBe(1);
    expect(all.items[0]).not.toHaveProperty("email");
    expect(all.items[0]).not.toHaveProperty("phoneE164");
    expect((await listSuperAdminUnassignedUsers(admin, { q: nonce, role: "SUPER_ADMIN" })).items.map(row => row.id)).toEqual([active]);
    expect((await listSuperAdminUnassignedUsers(admin, { q: nonce, platformStatus: "DISABLED", role: "NONE" })).items.map(row => row.id)).toEqual([disabled]);
    for (const adminScope of [{ organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB }, { organizationId: SEED_IDS.organization, collegeId: null }]) {
      await expect(listSuperAdminUnassignedUsers({ ...admin, adminScope }, { q: nonce })).rejects.toBeInstanceOf(AuthorizationError);
    }
    await expect(listSuperAdminUnassignedUsers({ ...admin, user: { ...admin.user, systemRoles: [] } }, {})).rejects.toBeInstanceOf(AuthorizationError);
    // Keep fixtures; never delete users referenced by immutable activity events.
  });
});
