import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createBugTrackerIssueForAdmin } from "@/modules/bug-tracker/report-service";
import { getBugTrackerIssueForAdmin } from "@/modules/bug-tracker/admin-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const enabled = process.env.DB10_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const context: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA },
};
const input = {
  reporterName: "Akhila",
  accountRole: "LEARNER",
  environment: "UAT",
  page: "Projects",
  screen: "Workspaces",
  section: "Members",
  issueType: "Wrong Data",
  severity: "MAJOR",
  description: "Team member details are incorrect on a workspace.",
  evidenceLink: "https://example.org/evidence",
};
const reported: string[] = [];

async function cleanup() {
  if (!pool) return;
  for (const publicId of reported) {
    const found = await pool.query(
      "select id from bug_reports where public_id = $1",
      [publicId],
    );
    for (const row of found.rows as { id: string }[]) {
      await pool.query("delete from bug_report_activities where bug_report_id = $1", [row.id]);
      await pool.query("delete from bug_reports where id = $1", [row.id]);
    }
    // Reporter access is an authenticated principal shared by multiple reports.
    // Never delete it from a fixture teardown: other persisted reports may
    // still reference the same access ID. This database is disposable.
  }
}

describe.skipIf(!enabled)("SA-placements-projects-100 tracker reporting on isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated PostgreSQL required");
    // Submission name must match the active authenticated principal, not
    // an unrelated historic hard-coded name. Never loosen identity binding.
    const { rows } = await pool.query<{ display_name: string | null }>(
      "select display_name from users where id=$1 and platform_status='ACTIVE'",
      [SEED_IDS.superAdminUser],
    );
    const persistedName = rows[0]?.display_name?.trim();
    if (!persistedName) throw new Error("Active seeded reporter display name missing");
    input.reporterName = persistedName;
  });
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("persists one report, scoped provenance and one immutable creation event", async () => {
    if (!pool) throw new Error("Isolated PostgreSQL required");
    const created = await createBugTrackerIssueForAdmin(context, input);
    reported.push(created.publicId);
    expect(created.publicId).toMatch(/^LMS-[0-9]{4,}$/);
    const detail = await getBugTrackerIssueForAdmin(context, created.publicId);
    expect(detail.report).toMatchObject({
      reporterName: input.reporterName,
      page: "Projects",
      screen: "Workspaces",
      section: "Members",
      collegeId: SEED_IDS.collegeA,
      status: "NEW",
      description: input.description,
    });
    expect(detail.activities).toHaveLength(1);
    expect(detail.activities[0]).toMatchObject({
      type: "CREATED",
      actorUserId: SEED_IDS.superAdminUser,
    });
    const access = await pool.query(
      "select active, access_role from bug_tracker_access where id=$1",
      [detail.report.reporterAccessId],
    );
    expect(access.rows[0]).toMatchObject({ active: true, access_role: "REPORTER" });
  });

  it("rejects an inactive reporter before touching the database", async () => {
    await expect(createBugTrackerIssueForAdmin({
      ...context,
      user: { ...context.user, platformStatus: "SUSPENDED" },
    }, input)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not let a scoped admin see an issue from another college", async () => {
    const created = await createBugTrackerIssueForAdmin(context, input);
    reported.push(created.publicId);
    await expect(getBugTrackerIssueForAdmin({
      ...context, adminScope: {
        organizationId: SEED_IDS.organization,
        collegeId: SEED_IDS.collegeB,
      },
    }, created.publicId)).rejects.toMatchObject({ code: "ISSUE_NOT_FOUND" });
  });
});
