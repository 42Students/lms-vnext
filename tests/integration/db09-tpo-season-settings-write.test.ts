import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { changeTpoRules, changeTpoSeason, TpoSettingsStaleError } from "@/modules/placements/tpo-season-write-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "db09-tpo-season-settings", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const wrongRole: RequestContext = {
  ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
};
afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });

describe.skipIf(!enabled)("DB09 TPO season and rules writes", () => {
  it("edits a seeded active season, writes an actor audit, rejects stale and restores the row", async () => {
    if (!pool) throw new Error("disposable DB required");
    const before = (await pool.query<{
      id: string; name: string; code: string; start_date: string; end_date: string; updated_at: Date;
    }>("SELECT id, name, code, start_date::text, end_date::text, updated_at FROM placement_seasons " +
      "WHERE college_id=$1 AND status='ACTIVE' LIMIT 1", [SEED_IDS.collegeA])).rows[0];
    if (!before) throw new Error("Active seed placement season required");
    const unique = randomUUID().slice(0, 8);
    const changed = await changeTpoSeason(tpo, {
      action: "EDIT", confirmed: true, seasonId: before.id,
      expectedUpdatedAt: before.updated_at.toISOString(),
      name: "PG season " + unique, code: "PG-" + unique,
      startDate: before.start_date, endDate: before.end_date,
    });
    expect(changed.name).toBe("PG season " + unique);
    const recorded = (await pool.query<{ count: number }>(
      "SELECT count(*)::integer AS count FROM activity_events WHERE subject_id=$1 " +
      "AND event_type='PLACEMENTS_SEASON_DETAILS_UPDATED' AND actor_membership_id=$2",
      [before.id, SEED_IDS.facultyCollegeAMembership],
    )).rows[0];
    expect(recorded?.count).toBeGreaterThan(0);
    await expect(changeTpoSeason(tpo, {
      action: "EDIT", confirmed: true, seasonId: before.id,
      expectedUpdatedAt: before.updated_at.toISOString(),
      name: "stale", code: "stale-" + unique,
      startDate: before.start_date, endDate: before.end_date,
    })).rejects.toBeInstanceOf(TpoSettingsStaleError);
    await changeTpoSeason(tpo, {
      action: "EDIT", confirmed: true, seasonId: before.id,
      expectedUpdatedAt: changed.updatedAt.toISOString(),
      name: before.name, code: before.code,
      startDate: before.start_date, endDate: before.end_date,
    });
    // Append-only audits remain preserved: never delete immutable evidence in cleanup.
  });
  it("rejects foreign college, wrong role and unconfirmed writes", async () => {
    const foreign: RequestContext = { ...tpo,
      membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB } };
    await expect(changeTpoSeason(wrongRole, {
      action: "CREATE", confirmed: true, name: "Deny", code: randomUUID().slice(0,8),
      startDate: "2027-01-01", endDate: "2027-12-31",
    })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(changeTpoSeason(foreign, {
      action: "EDIT", confirmed: true, seasonId: SEED_IDS.placementSeasonA,
      expectedUpdatedAt: "2026-10-14T00:00:00.000Z",
      name: "Denied", code: "Denied", startDate: "2027-01-01", endDate: "2027-12-31",
    })).rejects.toBeDefined();
    await expect(changeTpoRules(tpo, {
      confirmed: false, expectedVersion: 0, countsAsPlacedAt: "SELECTED",
      maxHeldOffers: 1, upliftPct: 40, minResponseHours: 48,
    })).rejects.toBeDefined();
  });
});
