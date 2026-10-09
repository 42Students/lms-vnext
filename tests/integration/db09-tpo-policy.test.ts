import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getCollegePlacementRules,
  getCompanyVisibilitySettings,
  saveCollegePlacementRules,
  saveCompanyVisibilitySettings,
} from "@/modules/placements/tpo-policy-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * Explicitly opt into destructive isolated-database tests.
 * The DB09 SQL draft is intentionally not registered in the shared journal.
 * Apply docs/planning/sql/db09-policy-visibility-premerge.sql only after
 * base migrations in a disposable PostgreSQL database.
 */
const dbUrl = process.env.TEST_DATABASE_URL;
const enabled =
  process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(dbUrl);
const pool = enabled ? new Pool({ connectionString: dbUrl, max: 3 }) : null;

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "db09-tpo",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["TPO"],
  },
};

const learner: RequestContext = {
  ...tpo,
  membership: { ...tpo.membership!, roles: ["LEARNER"] },
};

const recruiter: RequestContext = {
  ...tpo,
  membership: null,
  recruiter: {
    userId: tpo.user.id,
    companyId: "80000000-0000-4000-8000-000000000001",
    companyName: "Test Company",
    title: null,
    status: "ACTIVE",
    grants: [],
  },
};

describe.skipIf(!enabled)("DB09-A college policy and privacy PostgreSQL integration", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB09 isolated DB must be explicitly enabled");
    const result = await pool.query(
      "SELECT to_regclass('public.placement_college_rules') AS rules, " +
      "to_regclass('public.placement_company_visibility_settings') AS visibility",
    );
    if (!result.rows[0]?.rules || !result.rows[0]?.visibility) {
      throw new Error("DB09 unregistered policy SQL was not applied to isolated database");
    }
  });

  beforeEach(async () => {
    if (!pool) return;
    await pool.query(
      "DELETE FROM placement_college_rules WHERE college_id = $1",
      [SEED_IDS.collegeA],
    );
    await pool.query(
      "DELETE FROM placement_company_visibility_settings WHERE college_id = $1",
      [SEED_IDS.collegeA],
    );
  });

  afterAll(async () => {
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("uses legacy V162 defaults without mutating the database on GET", async () => {
    if (!pool) throw new Error("no db");
    const rules = await getCollegePlacementRules(tpo, SEED_IDS.collegeA);
    expect(rules).toMatchObject({
      countsAsPlacedAt: "OFFER_RELEASED",
      maxHeldOffers: 1,
      upliftPct: 40,
      minResponseHours: 48,
      version: 0,
    });
    const privacy = await getCompanyVisibilitySettings(tpo, SEED_IDS.collegeA);
    expect(privacy).toMatchObject({
      showCgpaExact: false,
      showTenthTwelfth: true,
      showProjectLinks: true,
      showAssessmentScores: false,
      showAttendance: false,
      version: 0,
    });
    const counts = await pool.query(
      "SELECT (SELECT COUNT(*) FROM placement_college_rules WHERE college_id = $1) AS rules, " +
      "(SELECT COUNT(*) FROM placement_company_visibility_settings WHERE college_id = $1) AS visibility",
      [SEED_IDS.collegeA],
    );
    expect(Number(counts.rows[0].rules)).toBe(0);
    expect(Number(counts.rows[0].visibility)).toBe(0);
  });

  it("rejects a second simultaneous write with stale expectedVersion", async () => {
    const writes = await Promise.all([
      saveCollegePlacementRules(tpo, {
        collegeId: SEED_IDS.collegeA, expectedVersion: 0, upliftPct: 35,
      }),
      saveCollegePlacementRules(tpo, {
        collegeId: SEED_IDS.collegeA, expectedVersion: 0, upliftPct: 55,
      }),
    ]);
    expect(writes.filter(x => x.ok)).toHaveLength(1);
    expect(writes.filter(x => !x.ok)).toHaveLength(1);
    const now = await getCollegePlacementRules(tpo, SEED_IDS.collegeA);
    expect(now.version).toBe(1);
    expect([35, 55]).toContain(now.upliftPct);

    const next = await saveCollegePlacementRules(tpo, {
      collegeId: SEED_IDS.collegeA,
      expectedVersion: 1,
      maxHeldOffers: 2,
    });
    expect(next.ok).toBe(true);
    const final = await getCollegePlacementRules(tpo, SEED_IDS.collegeA);
    expect(final.version).toBe(2);
    expect(final.maxHeldOffers).toBe(2);
  });

  it("preserves untouched company privacy flags on partial optimistic updates", async () => {
    const first = await saveCompanyVisibilitySettings(tpo, {
      collegeId: SEED_IDS.collegeA,
      expectedVersion: 0,
      showAssessmentScores: true,
    });
    expect(first.ok).toBe(true);
    const stale = await saveCompanyVisibilitySettings(tpo, {
      collegeId: SEED_IDS.collegeA,
      expectedVersion: 0,
      showCgpaExact: true,
    });
    expect(stale).toMatchObject({
      ok: false, error: "PLACEMENT_COMPANY_VISIBILITY_VERSION_CONFLICT",
    });
    const current = await getCompanyVisibilitySettings(tpo, SEED_IDS.collegeA);
    expect(current).toMatchObject({
      version: 1,
      showAssessmentScores: true,
      showCgpaExact: false,
      showAttendance: false,
      showTenthTwelfth: true,
    });
  });

  it("denies learner, recruiter and cross-college TPO writes", async () => {
    await expect(
      saveCompanyVisibilitySettings(recruiter, {
        collegeId: SEED_IDS.collegeA,
        expectedVersion: 0,
        showAttendance: true,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      saveCollegePlacementRules(learner, {
        collegeId: SEED_IDS.collegeA,
        expectedVersion: 0,
        maxHeldOffers: 2,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      saveCompanyVisibilitySettings(tpo, {
        collegeId: SEED_IDS.collegeB,
        expectedVersion: 0,
        showCgpaExact: true,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("enforces invalid policy values directly in PostgreSQL", async () => {
    if (!pool) throw new Error("no db");
    await expect(pool.query(
      "INSERT INTO placement_college_rules (college_id, max_held_offers) VALUES ($1, 0)",
      [SEED_IDS.collegeA],
    )).rejects.toMatchObject({ code: "23514" });
    await expect(pool.query(
      "INSERT INTO placement_college_rules (college_id, counts_as_placed_at) VALUES ($1, 'PENDING')",
      [SEED_IDS.collegeA],
    )).rejects.toMatchObject({ code: "23514" });
  });
});
