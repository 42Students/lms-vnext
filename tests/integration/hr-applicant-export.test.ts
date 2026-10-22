import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob } from "@/modules/placements/job-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import { createPersistedJobRecruiter, persistedRecruiterContext } from "../support/persisted-job-recruiter-fixture";
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
      applicationMode:"INTERNAL",minimumAnnualCtcInr:600000,maximumAnnualCtcInr:900000,applicationDeadline:new Date("2099-01-01T00:00:00Z")});
    await publishPreparedPlacementJob(tpo, job.id);
    const identityUid = "hr-csv-" + suffix;
    const persisted = await createPersistedJobRecruiter({ companyId: a.company.id,
      companyRelationshipId: a.relationship.id, collegeId: SEED_IDS.collegeA, jobId: job.id,
      grantedByUserId: tpo.user.id, identityUid });
    const recruiter = (companyId: string, relationshipId: string): RequestContext =>
      persistedRecruiterContext({ userId: persisted.userId, identityUid, companyId,
        grantId: persisted.grantId, collegeId: SEED_IDS.collegeA,
        organizationId: SEED_IDS.organization, companyRelationshipId: relationshipId });
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
