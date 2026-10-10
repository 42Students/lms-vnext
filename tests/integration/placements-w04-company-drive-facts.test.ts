import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob, publishPlacementJob } from "@/modules/placements/job-service";
import { getManagedCompanyDriveFacts } from "@/modules/placements/company-drive-facts-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * Disposable PostgreSQL only. Authored as a service contract for W05;
 * it is NOT claimed passing until CI/PG actually execute.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url || process.env.DATABASE_URL !== url ||
    process.env.W04_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error(
    "W04 CRM Drive facts integration requires matching TEST_DATABASE_URL and " +
    "DATABASE_URL plus W04_ISOLATED_TEST_DATABASE=1; never use a shared DB",
  );
}
const pool = new Pool({ connectionString: url, max: 2 });
const tpoA: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "seed-faculty",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"],
  },
};
const tpoB: RequestContext = {
  ...tpoA,
  membership: {
    id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["TPO"],
  },
};
const ids = {
  jobs: [] as string[],
  relationships: [] as string[],
  companies: [] as string[],
};
afterEach(async () => {
  await pool.query("DELETE FROM placement_jobs WHERE id=ANY($1::uuid[])", [ids.jobs]);
  await pool.query(
    "DELETE FROM placement_company_relationships WHERE id=ANY($1::uuid[])",
    [ids.relationships],
  );
  await pool.query("DELETE FROM placement_companies WHERE id=ANY($1::uuid[])", [ids.companies]);
  ids.jobs.length = ids.relationships.length = ids.companies.length = 0;
});
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("W04 college-scoped derived CRM Drive execution facts", () => {
  it("counts only published drives, not drafts, without exposing applicant data", async () => {
    const company = await createPlacementCompany(tpoA, {
      collegeId: SEED_IDS.collegeA, name: "W04 CRM Evidence Company",
      primaryDomain: "w04-facts.example",
    });
    ids.companies.push(company.company.id);
    ids.relationships.push(company.relationship.id);
    const draft = await createPlacementJob(tpoA, {
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId: company.relationship.id,
      title: "W04 Engineer", description: "W04 scoped CRM derived facts",
      employmentType: "FULL_TIME", workMode: "HYBRID",
      applicationMode: "INTERNAL",
    });
    ids.jobs.push(draft.id);

    const pending = await getManagedCompanyDriveFacts(
      tpoA, SEED_IDS.collegeA, company.relationship.id,
    );
    expect(pending).toMatchObject({
      relationshipExists: true, plannedDriveCount: 0,
      hasDrivePlanned: false, hasAcceptedOffer: false, hasConfirmedJoin: false,
    });

    await publishPlacementJob(tpoA, draft.id);
    const published = await getManagedCompanyDriveFacts(
      tpoA, SEED_IDS.collegeA, company.relationship.id,
    );
    expect(published).toMatchObject({
      relationshipExists: true, plannedDriveCount: 1,
      hasDrivePlanned: true, hasAcceptedOffer: false, hasConfirmedJoin: false,
    });
    expect("applicants" in published).toBe(false);
  });

  it("does not disclose another college's placement relationship", async () => {
    const company = await createPlacementCompany(tpoA, {
      collegeId: SEED_IDS.collegeA, name: "W04 CRM Tenant Company",
      primaryDomain: "w04-tenant-facts.example",
    });
    ids.companies.push(company.company.id);
    ids.relationships.push(company.relationship.id);

    await expect(getManagedCompanyDriveFacts(
      tpoB, SEED_IDS.collegeA, company.relationship.id,
    )).rejects.toThrow();
    const noBRelationship = await getManagedCompanyDriveFacts(
      tpoB, SEED_IDS.collegeB, company.relationship.id,
    );
    expect(noBRelationship).toMatchObject({
      relationshipExists: false,
      hasDrivePlanned: false,
      hasAcceptedOffer: false,
      hasConfirmedJoin: false,
    });
  });
});
