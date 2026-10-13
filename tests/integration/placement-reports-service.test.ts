import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import {
  getPlacementReportDetails,
  getPlacementReportWorkspace,
} from "@/modules/placements/report-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Report tests require a disposable TEST_DATABASE_URL");
}

const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
  max: 2,
});
let seasonId: string = randomUUID();
let createdSeason = false;
const code = `RPT-${seasonId.slice(0, 8)}`;

const adminA: RequestContext = {
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

beforeAll(async () => {
  // One ACTIVE season per college is enforced; reuse it when it already exists.
  const existing = await pool.query(
    "select id from placement_seasons where college_id = $1 and status = 'ACTIVE'",
    [SEED_IDS.collegeA],
  );

  if (existing.rows[0]) {
    seasonId = existing.rows[0].id as string;
    return;
  }

  createdSeason = true;
  await pool.query(
    `insert into placement_seasons
       (id, college_id, name, code, start_date, end_date, status, created_by_user_id)
     values ($1, $2, 'Synthetic Season', $3, '2020-01-01', '2040-12-31', 'ACTIVE', $4)`,
    [seasonId, SEED_IDS.collegeA, code, SEED_IDS.collegeAdminUser],
  );
});

afterAll(async () => {
  if (createdSeason) {
    await pool.query("delete from placement_seasons where id = $1", [seasonId]);
  }
  await pool.end();
  await closeDatabaseConnection();
});

describe("placement report workspace against PostgreSQL", () => {
  it("reads a real season even when staged registration tables are absent", async () => {
    const workspace = await getPlacementReportWorkspace(adminA, {
      collegeId: SEED_IDS.collegeA,
      seasonId,
    });

    expect(workspace.noSeason).toBe(false);
    expect(workspace.selectedSeasonId).toBe(seasonId);
    expect(workspace.report.metrics.drives).toBeGreaterThanOrEqual(0);
    expect(typeof workspace.registrationScopeNote).toBe("string");
  });

  it("builds the additional detail reports without the staged registration table", async () => {
    const detailed = await getPlacementReportDetails(adminA, {
      collegeId: SEED_IDS.collegeA,
      seasonId,
    });

    expect(detailed.details.ctc.bands.length).toBeGreaterThan(0);
    expect(Array.isArray(detailed.details.unplaced)).toBe(true);
    expect(detailed.details.offers.totals.released).toBeGreaterThanOrEqual(0);
    expect(typeof detailed.detailScopeNote).toBe("string");
  });

  it("does not expose another college's season", async () => {
    await expect(
      getPlacementReportWorkspace(adminA, {
        collegeId: SEED_IDS.collegeB,
      }),
    ).rejects.toThrow();
  });
});
