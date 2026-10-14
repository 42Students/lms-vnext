import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoCalendarRoundExport } from "@/modules/placements/tpo-calendar-export-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: randomUUID(),
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
const query = { from: "2026-10-14", to: "2026-10-21" };
describe.skipIf(!enabled)("TPO calendar export PostgreSQL tenant boundaries", () => {
  afterAll(async () => { await closeDatabaseConnection(); });
  it("denies non-TPO role before returning scheduled round data", async () => {
    await expect(getTpoCalendarRoundExport({
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    }, query)).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("does not read college A rounds when using a college B principal", async () => {
    const other: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    const result = await getTpoCalendarRoundExport(other, query,
      new Date("2026-10-14T00:00:00.000Z"));
    expect(result.rows.every((row) => row.id !== "not-a-shared-id")).toBe(true);
    expect(result.rows).toEqual([]);
  });
});
