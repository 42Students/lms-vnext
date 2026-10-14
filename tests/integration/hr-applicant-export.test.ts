import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob, publishPlacementJob } from "@/modules/placements/job-service";
import { getHrJobRead } from "@/modules/placements/hr-job-read-service";
import { buildHrApplicantCsv } from "@/modules/placements/hr-applicant-export-model";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const tpo: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "hr-export-tpo", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"] },
};
describe.skipIf(!enabled)("recruiter CSV exact company scope", () => {
  afterAll(async () => { await closeDatabaseConnection(); });
  it("authorizes own job and masks a different employer and wrong role", async () => {
    const suffix = randomUUID().slice(0, 8);
    const a = await createPlacementCompany(tpo, {collegeId: SEED_IDS.collegeA,
      name: "HR CSV A " + suffix, primaryDomain: "csv-a-" + suffix + ".example"});
    const b = await createPlacementCompany(tpo, {collegeId: SEED_IDS.collegeA,
      name: "HR CSV B " + suffix, primaryDomain: "csv-b-" + suffix + ".example"});
    const job = await createPlacementJob(tpo, {collegeId: SEED_IDS.collegeA,
      companyRelationshipId: a.relationship.id, title: "HR CSV Job " + suffix,
      description: "Fixture", employmentType: "FULL_TIME", workMode: "HYBRID",
      applicationMode: "INTERNAL"});
    await publishPlacementJob(tpo, job.id);
    const userId = randomUUID();
    const recruiter = (companyId: string, relationshipId: string): RequestContext => ({
      user: { id: userId, identityUid: "hr-csv-" + suffix, platformStatus: "ACTIVE", systemRoles: [] },
      membership: null, recruiter: { userId, companyId, companyName: "Fixture", status: "ACTIVE",
        title: null, grants: [{ id: randomUUID(), collegeId: SEED_IDS.collegeA,
          organizationId: SEED_IDS.organization, collegeName: "Fixture",
          companyRelationshipId: relationshipId }] },
    });
    const allowed = await getHrJobRead(recruiter(a.company.id, a.relationship.id), job.id, { tab: "applicants" });
    const csv = buildHrApplicantCsv(allowed.applicants.rows, allowed.applicants.counts.all);
    expect(csv.exported).toBe(0);
    expect(csv.csv).not.toContain("@example.test");
    await expect(getHrJobRead(recruiter(b.company.id, b.relationship.id), job.id, {tab:"applicants"}))
      .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
    await expect(getHrJobRead(tpo, job.id, {tab:"applicants"}))
      .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  });
});
