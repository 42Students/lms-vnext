import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob, publishPlacementJob } from "@/modules/placements/job-service";
import { getRecruiterPlacementWorkspace } from "@/modules/placements/recruiter-workspace-service";
import { hrDraftFromAuthorizedJob } from "@/modules/placements/hr-drive-draft-model";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "hr-draft-tpo", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};

describe.skipIf(!enabled)("Recruiter authorized Hire Again preview", () => {
  afterAll(async () => { await closeDatabaseConnection(); });
  it("copies a company-owned job while hiding the same job from foreign company, college and wrong role", async () => {
    const nonce = randomUUID().slice(0, 8);
    const a = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA, name: "Recruiter Draft A " + nonce,
      primaryDomain: "draft-a-" + nonce + ".example",
    });
    const b = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA, name: "Recruiter Draft B " + nonce,
      primaryDomain: "draft-b-" + nonce + ".example",
    });
    const job = await createPlacementJob(tpo, {
      collegeId: SEED_IDS.collegeA, companyRelationshipId: a.relationship.id,
      title: "Recruiter Draft " + nonce, description: "Hiring engineer test fixture",
      employmentType: "FULL_TIME", workMode: "HYBRID", applicationMode: "INTERNAL",
    });
    await publishPlacementJob(tpo, job.id);
    const userId = randomUUID();
    const hr = (companyId: string, relation: string, collegeId: string): RequestContext => ({
      user: { id: userId, identityUid: "hr-draft-" + nonce, platformStatus: "ACTIVE", systemRoles: [] },
      membership: null, recruiter: {
        userId, companyId, companyName: "Fixture", title: null, status: "ACTIVE",
        grants: [{ id: randomUUID(), collegeId, organizationId: SEED_IDS.organization,
          collegeName: "Fixture", companyRelationshipId: relation }],
      },
    });
    const own = await getRecruiterPlacementWorkspace(hr(a.company.id, a.relationship.id, SEED_IDS.collegeA), job.id);
    expect(hrDraftFromAuthorizedJob(own.job, own.rounds).title).toBe("Recruiter Draft " + nonce);
    await expect(getRecruiterPlacementWorkspace(hr(b.company.id, b.relationship.id, SEED_IDS.collegeA), job.id))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await expect(getRecruiterPlacementWorkspace(hr(a.company.id, a.relationship.id, SEED_IDS.collegeB), job.id))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await expect(getRecruiterPlacementWorkspace(tpo, job.id))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
  });
});
