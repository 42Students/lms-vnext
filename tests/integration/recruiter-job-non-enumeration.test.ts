import { publishableJobTerms } from "../support/publishable-job-terms";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob, publishPlacementJob } from "@/modules/placements/job-service";
import { getRecruiterPlacementWorkspace } from "@/modules/placements/recruiter-workspace-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "recruiter-boundary-tpo", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
describe.skipIf(!enabled)("HR employer job non-enumeration (isolated PG)", () => {
  afterAll(async () => {
    // These in-test jobs may be referenced by append-only activity_events. Do not delete them.
    await closeDatabaseConnection();
  });
  it("shows own job, but masks foreign-company, foreign-college and wrong-role access as not found", async () => {
    const nonce = randomUUID().slice(0, 8);
    const first = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA, name: "HR Boundary First " + nonce,
      primaryDomain: "first-" + nonce + ".example",
    });
    const second = await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA, name: "HR Boundary Second " + nonce,
      primaryDomain: "second-" + nonce + ".example",
    });
    const job = await createPlacementJob(tpo, {
      ...publishableJobTerms,
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId: first.relationship.id,
      title: "Hiring Analyst " + nonce, description: "Boundary fixture",
      employmentType: "FULL_TIME", workMode: "HYBRID", applicationMode: "INTERNAL",
    });
    await publishPlacementJob(tpo, job.id);
    const uid = randomUUID();
    function hr(companyId: string, relation: string, collegeId: string): RequestContext {
      return { user: { id: uid, identityUid: "fixture-" + nonce, platformStatus: "ACTIVE", systemRoles: [] },
        membership: null, recruiter: { userId: uid, companyId, companyName: "Fixture", status: "ACTIVE", title: null,
          grants: [{ id: randomUUID(), collegeId, organizationId: SEED_IDS.organization,
            collegeName: "Fixture College", companyRelationshipId: relation }] } };
    }
    const own = hr(first.company.id, first.relationship.id, SEED_IDS.collegeA);
    expect((await getRecruiterPlacementWorkspace(own, job.id)).job.id).toBe(job.id);
    const foreignCompany = hr(second.company.id, second.relationship.id, SEED_IDS.collegeA);
    await expect(getRecruiterPlacementWorkspace(foreignCompany, job.id))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    const foreignCollege = hr(first.company.id, first.relationship.id, SEED_IDS.collegeB);
    await expect(getRecruiterPlacementWorkspace(foreignCollege, job.id))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await expect(getRecruiterPlacementWorkspace(tpo, job.id))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
    await expect(getRecruiterPlacementWorkspace(own, randomUUID()))
      .rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_FOUND" });
  });
});
