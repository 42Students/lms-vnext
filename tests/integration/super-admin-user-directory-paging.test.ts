import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { createCollege } from "@/modules/colleges/service";
import { listSuperAdminUsers } from "@/modules/people/admin-user-directory-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "directory-paging", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null, adminScope: null };
describe.skipIf(!enabled)("Super Admin directory paging and combined scope (PG)", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("clamps a 31-row fixture, preserves role filtering/aliases, hides foreign and mismatched scopes and denies wrong role", async () => {
    const token = randomUUID().slice(0, 10);
    const own = await createCollege(admin, { organizationId: SEED_IDS.organization, name: "People Own " + token, code: "PGO-" + token });
    const other = await createCollege(admin, { organizationId: SEED_IDS.organization, name: "People Other " + token, code: "PGF-" + token });
    const ids: string[] = [];
    for (let i = 0; i < 32; i++) {
      const id = randomUUID(), membershipId = randomUUID();
      ids.push(id);
      await pool!.query("insert into users (id,identity_uid,display_name) values ($1,$2,$3)", [id, "paging-" + id, `Page ${String(i).padStart(2, "0")} ${token}`]);
      await pool!.query("insert into college_memberships (id,user_id,college_id) values ($1,$2,$3)", [membershipId, id, i < 31 ? own.id : other.id]);
      await pool!.query("insert into membership_roles (membership_id,role) values ($1,'FACULTY')", [membershipId]);
    }
    const scoped = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: own.id } };
    const last = await listSuperAdminUsers(scoped, { q: token, tab: "FACULTY", page: 999 });
    expect(last.total).toBe(31);
    expect(last.query.page).toBe(2);
    expect(last.items.map(row => row.userId)).toEqual([ids[30]]);
    expect(last.items[0].collegeId).toBe(own.id);
    expect(last.items[0].roles).toEqual(["FACULTY"]);
    expect((await listSuperAdminUsers(scoped, { q: "Absent " + token, page: 999 })).query.page).toBe(1);
    const foreign = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: other.id } };
    expect((await listSuperAdminUsers(foreign, { q: token })).items.map(row => row.userId)).toEqual([ids[31]]);
    const mismatched = { ...admin, adminScope: { organizationId: randomUUID(), collegeId: own.id } };
    expect((await listSuperAdminUsers(mismatched, { q: token })).items).toEqual([]);
    await expect(listSuperAdminUsers({ ...admin, user: { ...admin.user, systemRoles: [] } }, {})).rejects.toBeInstanceOf(AuthorizationError);
    // Retain fixture identities/memberships; never risk deleting referenced audit actors.
  });
});
