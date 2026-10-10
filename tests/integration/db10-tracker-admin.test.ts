import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  getBugTrackerIssueForAdmin,
  listBugTrackerIssuesForAdmin,
  retestBugTrackerIssueForAdmin,
  updateBugTrackerWorkflowForAdmin,
} from "@/modules/bug-tracker/admin-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const dbUrl = process.env.TEST_DATABASE_URL;
const enabled =
  process.env.DB10_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(dbUrl);
const pool = enabled ? new Pool({ connectionString: dbUrl, max: 3 }) : null;

const ACCESS_ID = "91000000-0000-4000-8000-000000000001";
const REPORT_A_ID = "92000000-0000-4000-8000-000000000001";
const REPORT_B_ID = "92000000-0000-4000-8000-000000000002";

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

const scopedA: RequestContext = {
  ...superAdmin,
  adminScope: {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
  },
};

const scopedB: RequestContext = {
  ...superAdmin,
  adminScope: {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeB,
  },
};

const collegeAdmin: RequestContext = {
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

async function cleanup() {
  if (!pool) return;
  await pool.query(
    "delete from bug_report_activities where bug_report_id in ($1, $2)",
    [REPORT_A_ID, REPORT_B_ID],
  );
  await pool.query(
    "delete from bug_report_attachments where bug_report_id in ($1, $2)",
    [REPORT_A_ID, REPORT_B_ID],
  );
  await pool.query(
    "delete from bug_reports where id in ($1, $2)",
    [REPORT_A_ID, REPORT_B_ID],
  );
  await pool.query(
    "delete from bug_tracker_sessions where access_id = $1",
    [ACCESS_ID],
  );
  await pool.query(
    "delete from bug_tracker_access where id = $1",
    [ACCESS_ID],
  );
}

async function seed() {
  if (!pool) throw new Error("DB10 isolated DB not enabled");
  await pool.query(
    `insert into bug_tracker_access
      (id, display_name, token_hash, access_role, active)
     values ($1, 'W06 Reporter', $2, 'REPORTER', true)`,
    [ACCESS_ID, "a".repeat(64)],
  );
  for (const [id, publicId, collegeId, createdAt] of [
    [REPORT_A_ID, "LMS-9801", SEED_IDS.collegeA, "2026-10-10T08:00:00.000Z"],
    [REPORT_B_ID, "LMS-9802", SEED_IDS.collegeB, "2026-10-10T09:00:00.000Z"],
  ] as const) {
    await pool.query(
      `insert into bug_reports (
        id, public_id, reporter_access_id, college_id, reporter_name,
        account_role, environment, page, issue_type, description, severity,
        status, regression_test_status, production_verified, retest_status,
        version, created_at, updated_at
      ) values (
        $1, $2, $3, $4, 'W06 Reporter',
        'COLLEGE_ADMIN', 'UAT', '/college/people', 'FUNCTIONAL',
        'Tracker integration fixture', 'MAJOR',
        'NEW', 'NOT_REVIEWED', false, 'NOT_RETESTED',
        0, $5, $5
      )`,
      [id, publicId, ACCESS_ID, collegeId, createdAt],
    );
  }
}

describe.skipIf(!enabled)("W06 DB10 Tracker admin PostgreSQL integration", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB10 isolated DB must be explicitly enabled");
    const result = await pool.query(
      "select to_regclass('public.bug_reports') as reports, " +
      "to_regclass('public.bug_report_activities') as activities, " +
      "to_regclass('public.bug_report_attachments') as attachments",
    );
    if (
      !result.rows[0]?.reports ||
      !result.rows[0]?.activities ||
      !result.rows[0]?.attachments
    ) {
      throw new Error(
        "DB10 Tracker draft tables were not applied to the isolated database",
      );
    }
  });

  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("enforces selected-college scope and rejects non-Super-Admin readers", async () => {
    const global = await listBugTrackerIssuesForAdmin(superAdmin, {
      sort: "newest",
      limit: 50,
    });
    expect(global.items.map((row) => row.publicId)).toEqual(
      expect.arrayContaining(["LMS-9801", "LMS-9802"]),
    );

    const a = await listBugTrackerIssuesForAdmin(scopedA, {
      sort: "newest",
      limit: 50,
    });
    expect(a.items.map((row) => row.publicId)).toContain("LMS-9801");
    expect(a.items.map((row) => row.publicId)).not.toContain("LMS-9802");

    await expect(
      getBugTrackerIssueForAdmin(scopedB, "LMS-9801"),
    ).rejects.toMatchObject({ code: "ISSUE_NOT_FOUND" });
    await expect(
      listBugTrackerIssuesForAdmin(collegeAdmin, { limit: 50 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("uses stable cursors and source filters without leaking another scoped college", async () => {
    const first = await listBugTrackerIssuesForAdmin(superAdmin, {
      sort: "newest",
      limit: 1,
      environment: "UAT",
      severity: "MAJOR",
      q: "Tracker integration",
    });
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toBeTruthy();

    const second = await listBugTrackerIssuesForAdmin(superAdmin, {
      sort: "newest",
      limit: 1,
      beforeCreatedAt: first.nextCursor!.beforeCreatedAt.toISOString(),
      beforeId: first.nextCursor!.beforeId,
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it("allows exactly one concurrent optimistic workflow writer and appends history atomically", async () => {
    const writes = await Promise.allSettled([
      updateBugTrackerWorkflowForAdmin(superAdmin, "LMS-9801", {
        expectedVersion: 0,
        status: "CHECKING",
      }),
      updateBugTrackerWorkflowForAdmin(superAdmin, "LMS-9801", {
        expectedVersion: 0,
        status: "FIXING",
      }),
    ]);
    expect(writes.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(writes.filter((x) => x.status === "rejected")).toHaveLength(1);

    const detail = await getBugTrackerIssueForAdmin(superAdmin, "LMS-9801");
    expect(detail.report.version).toBe(1);
    expect(["CHECKING", "FIXING"]).toContain(detail.report.status);
    expect(detail.activities).toHaveLength(1);
    expect(detail.activities[0]?.actorUserId).toBe(SEED_IDS.superAdminUser);
  });

  it("returns sanitized attachment metadata without storage keys", async () => {
    if (!pool) throw new Error("no DB");
    await pool.query(
      `insert into bug_report_attachments
        (bug_report_id, storage_key, original_filename, content_type, size_bytes)
       values ($1, $2, 'screen.png', 'image/png', 1024)`,
      [
        REPORT_A_ID,
        "bug-tracker/LMS-9801/550e8400-e29b-41d4-a716-446655440000.png",
      ],
    );
    const detail = await getBugTrackerIssueForAdmin(superAdmin, "LMS-9801");
    expect(detail.attachments).toHaveLength(1);
    expect(detail.attachments[0]).toMatchObject({
      originalFilename: "screen.png",
      contentType: "image/png",
      sizeBytes: 1024,
    });
    expect(detail.attachments[0]).not.toHaveProperty("storageKey");
  });

  it("persists READY_FOR_RETEST -> PASS as CLOSED/FIXED with an immutable retest event", async () => {
    const ready = await updateBugTrackerWorkflowForAdmin(
      superAdmin,
      "LMS-9801",
      { expectedVersion: 0, status: "READY_FOR_RETEST" },
    );
    expect(ready.version).toBe(1);

    const closed = await retestBugTrackerIssueForAdmin(
      superAdmin,
      "LMS-9801",
      { expectedVersion: 1, result: "PASS", note: "Verified in UAT" },
    );
    expect(closed).toMatchObject({
      status: "CLOSED",
      resolution: "FIXED",
      retestStatus: "PASS",
      version: 2,
    });

    const detail = await getBugTrackerIssueForAdmin(superAdmin, "LMS-9801");
    expect(detail.activities.map((row) => row.type))
      .toEqual(expect.arrayContaining(["STATUS_CHANGED", "RETEST"]));
    expect(detail.activities.find((row) => row.type === "RETEST")?.note)
      .toBe("Verified in UAT");
  });
});
