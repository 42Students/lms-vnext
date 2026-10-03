import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  archivePlacementJob,
  closePlacementJob,
  createPlacementJob,
  publishPlacementJob,
  updatePlacementJob,
} from "@/modules/placements/job-service";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL or DATABASE_URL is required");

const pool = new Pool({ connectionString: databaseUrl, max: 1 });

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "MENTOR", "TPO"],
  },
};

const ids = {
  company: "78000000-0000-4000-8000-000000000001",
  relationshipA: "78000000-0000-4000-8000-000000000002",
  relationshipB: "78000000-0000-4000-8000-000000000003",
};

async function cleanup() {
  await pool.query("delete from placement_jobs where company_relationship_id in ($1, $2)", [
    ids.relationshipA,
    ids.relationshipB,
  ]);
  await pool.query("delete from placement_company_relationships where id in ($1, $2)", [
    ids.relationshipA,
    ids.relationshipB,
  ]);
  await pool.query("delete from placement_companies where id = $1", [ids.company]);
}

beforeEach(async () => {
  await cleanup();
  await pool.query(
    `insert into placement_companies
      (id, name, status, created_by_user_id)
     values ($1, 'Jobs Test Employer', 'ACTIVE', $2)`,
    [ids.company, SEED_IDS.facultyUser],
  );
  await pool.query(
    `insert into placement_company_relationships
      (id, college_id, company_id, status, created_by_user_id)
     values
      ($1, $3, $2, 'ACTIVE', $5),
      ($4, $6, $2, 'ACTIVE', $5)`,
    [
      ids.relationshipA,
      ids.company,
      SEED_IDS.collegeA,
      ids.relationshipB,
      SEED_IDS.facultyUser,
      SEED_IDS.collegeB,
    ],
  );
});

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement jobs", () => {
  it("creates a tenant-owned draft and runs the publish/close/archive lifecycle", async () => {
    const draft = await createPlacementJob(tpo, {
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId: ids.relationshipA,
      title: "Software Engineer",
      description: "Build product features.",
      employmentType: "FULL_TIME",
      workMode: "HYBRID",
      locations: ["Hyderabad"],
      minimumAnnualCtcInr: 800000,
      maximumAnnualCtcInr: 1200000,
      applicationMode: "INTERNAL",
    });

    expect(draft.status).toBe("DRAFT");
    expect(draft.publishedAt).toBeNull();

    const updated = await updatePlacementJob(tpo, draft.id, {
      title: "Software Engineer I",
      openings: 5,
    });
    expect(updated.title).toBe("Software Engineer I");

    const published = await publishPlacementJob(tpo, draft.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).toBeInstanceOf(Date);

    await expect(
      updatePlacementJob(tpo, draft.id, { title: "Mutated live job" }),
    ).rejects.toMatchObject({ code: "PLACEMENT_JOB_NOT_EDITABLE" });

    await expect(
      archivePlacementJob(tpo, draft.id),
    ).rejects.toMatchObject({ code: "PLACEMENT_JOB_CLOSE_BEFORE_ARCHIVE" });

    const closed = await closePlacementJob(tpo, draft.id);
    expect(closed.status).toBe("CLOSED");
    expect(closed.closedAt).toBeInstanceOf(Date);

    const archived = await archivePlacementJob(tpo, draft.id);
    expect(archived.status).toBe("ARCHIVED");
    expect(archived.archivedAt).toBeInstanceOf(Date);
  });

  it("rejects cross-college company relationship substitution", async () => {
    await expect(
      createPlacementJob(tpo, {
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId: ids.relationshipB,
        title: "Wrong tenant",
        description: "Must fail.",
        employmentType: "FULL_TIME",
        workMode: "ONSITE",
      }),
    ).rejects.toBeInstanceOf(PlacementsServiceError);
  });

  it("requires an external URL for external-only jobs", async () => {
    await expect(
      createPlacementJob(tpo, {
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId: ids.relationshipA,
        title: "External role",
        description: "Apply externally.",
        employmentType: "INTERNSHIP",
        workMode: "REMOTE",
        applicationMode: "EXTERNAL_ONLY",
      }),
    ).rejects.toThrow();
  });
});
