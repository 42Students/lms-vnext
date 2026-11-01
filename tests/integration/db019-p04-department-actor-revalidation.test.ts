import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCollegeBranding } from "@/modules/colleges/branding-service";
import type { RequestContext } from "@/modules/identity/context";
import {
  createDepartment, renameDepartment, archiveDepartment,
  listDepartments, fetchPagedDepartments,
} from "@/modules/departments/service";
import {
  createCollegeDepartment, renameCollegeDepartment, archiveCollegeDepartment,
} from "@/modules/departments/college-department-mutation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

// DB19-P04: service-bound writes may run only against an independently
// prepared, explicitly disposable PG17 target. Never point these at prod.
const enabled = !!process.env.TEST_DATABASE_URL &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;

const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "db19-p04-admin",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};

// Both claims pass an in-memory snapshot check. Neither matches persisted
// authority: the first fabricates a global role, the second claims someone
// else's membership. This reproduces stale/revoked-context risk without
// changing shared fixture account grants.
const falseGlobal: RequestContext = {
  user: { ...admin.user, systemRoles: ["SUPER_ADMIN"] },
  membership: null,
  adminScope: { organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA },
};
const falseMembership: RequestContext = {
  ...admin,
  membership: { ...admin.membership!,
    id: SEED_IDS.facultyCollegeAMembership, roles: ["COLLEGE_ADMIN"] },
};

async function removeDepartment(id: string) {
  if (!pool) return;
  await pool.query(`DELETE FROM in_app_notifications WHERE event_id IN
    (SELECT id FROM activity_events WHERE subject_id=$1)`, [id]);
  await pool.query("DELETE FROM activity_events WHERE subject_id=$1", [id]);
  await pool.query("DELETE FROM departments WHERE id=$1", [id]);
}

afterAll(async () => {
  await pool?.end();
  await closeDatabaseConnection();
});

describe.skipIf(!enabled)("DB19-P04 persisted department authority on PostgreSQL", () => {
  it("rejects forged global authority for both department creation paths without new rows", async () => {
    const prefix = "p04-deny-" + randomUUID();
    await expect(createDepartment(falseGlobal, {
      collegeId: SEED_IDS.collegeA, name: prefix + "-classic",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createCollegeDepartment(falseGlobal, {
      name: prefix + "-acting",
    })).rejects.toBeInstanceOf(AuthorizationError);
    const rows = await pool!.query(
      "SELECT id FROM departments WHERE name LIKE $1", [prefix + "%"],
    );
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a forged membership and stale-role snapshot on both writers", async () => {
    const prefix = "p04-member-deny-" + randomUUID();
    await expect(createDepartment(falseMembership, {
      collegeId: SEED_IDS.collegeA, name: prefix + "-classic",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(createCollegeDepartment(falseMembership, {
      name: prefix + "-acting",
    })).rejects.toBeInstanceOf(AuthorizationError);
    const rows = await pool!.query(
      "SELECT id FROM departments WHERE name LIKE $1", [prefix + "%"],
    );
    expect(rows.rows).toHaveLength(0);
  });

  it("fails closed on stale or forged roles during department directory reads", async () => {
    // A snapshot with a forged SUPER_ADMIN role must not enumerate other
    // tenants when its real persisted actor is only a college administrator.
    await expect(fetchPagedDepartments(falseGlobal, {page: 0, size: 10}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(fetchPagedDepartments(falseGlobal, {
      collegeId: SEED_IDS.collegeB, page: 0, size: 10,
    })).rejects.toBeInstanceOf(AuthorizationError);
    // Fabricating COLLEGE_ADMIN against a different persisted membership
    // must not read either the direct or paged roster.
    await expect(listDepartments(falseMembership, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(fetchPagedDepartments(falseMembership, {
      collegeId: SEED_IDS.collegeA, page: 0, size: 10,
    })).rejects.toBeInstanceOf(AuthorizationError);

    const direct = await listDepartments(admin, SEED_IDS.collegeA);
    const paged = await fetchPagedDepartments(admin, {
      collegeId: SEED_IDS.collegeA, page: 0, size: 10,
    });
    expect(paged.content.every(row => row.collegeId === SEED_IDS.collegeA)).toBe(true);
    expect(paged.totalElements).toBeGreaterThanOrEqual(paged.content.length);
    expect(direct.every(row => row.collegeId === SEED_IDS.collegeA)).toBe(true);
  });

  it("does not return protected college branding using stale global or forged membership permissions", async () => {
    await expect(getCollegeBranding(falseGlobal, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(getCollegeBranding(falseMembership, SEED_IDS.collegeA))
      .rejects.toBeInstanceOf(AuthorizationError);
    const brand = await getCollegeBranding(admin, SEED_IDS.collegeA);
    expect(brand).toHaveProperty("collegeName");
    expect(brand).toHaveProperty("signInMethod");
    expect(brand).toHaveProperty("version");
    expect(brand).not.toHaveProperty("legacyBrandingId");
    expect(brand).not.toHaveProperty("legacyLogoSourceUrl");
  });

  it("rejects stale actor rename and archive while retaining valid college-admin writes", async () => {
    const name = "p04-department-" + randomUUID();
    const created = await createDepartment(admin, {
      collegeId: SEED_IDS.collegeA, name,
    });
    try {
      await expect(renameDepartment(falseGlobal, created.id, {
        name: name + "-forged",
      })).rejects.toBeInstanceOf(AuthorizationError);
      await expect(archiveDepartment(falseGlobal, created.id))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(renameCollegeDepartment(falseMembership, created.id, {
        name: name + "-forged-acting", confirm: true,
      })).rejects.toBeInstanceOf(AuthorizationError);
      await expect(archiveCollegeDepartment(falseMembership, created.id, {
        confirm: true,
      })).rejects.toBeInstanceOf(AuthorizationError);

      const unchanged = await pool!.query<{ name: string; archived_at: Date | null }>(
        "SELECT name, archived_at FROM departments WHERE id=$1", [created.id],
      );
      expect(unchanged.rows[0]).toEqual({ name, archived_at: null });

      const renamed = await renameDepartment(admin, created.id, {
        name: name + "-legit",
      });
      expect(renamed.name).toBe(name + "-legit");
      const actingRenamed = await renameCollegeDepartment(admin, created.id, {
        name: name + "-legit-acting", confirm: true,
      });
      expect(actingRenamed.name).toBe(name + "-legit-acting");
      const archived = await archiveDepartment(admin, created.id);
      expect(archived.archivedAt).toBeInstanceOf(Date);
    } finally {
      await removeDepartment(created.id);
    }
  });
});
