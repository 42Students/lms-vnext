import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getTpoShareableShortlist } from "@/modules/placements/tpo-shareable-shortlist-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "tpo-share-preview-" + randomUUID(),
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
describe.skipIf(!enabled)("TPO shortlist sharing report PostgreSQL scope", () => {
  afterAll(async () => { await closeDatabaseConnection(); });
  it("rejects wrong role before reading recruiter-visible candidates", async () => {
    await expect(getTpoShareableShortlist({
      ...tpo, membership: { ...tpo.membership!, roles: ["LEARNER"] },
    }, { jobId: randomUUID() })).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("does not reveal foreign or unknown drive identity", async () => {
    await expect(getTpoShareableShortlist(tpo, { jobId: randomUUID() }))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    const other: RequestContext = {
      ...tpo, membership: { ...tpo.membership!, collegeId: SEED_IDS.collegeB },
    };
    await expect(getTpoShareableShortlist(other, { jobId: randomUUID() }))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
  });
});
