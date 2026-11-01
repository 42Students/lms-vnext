import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { confirmTrackerAttachment } from "@/modules/bug-tracker/attachment-storage-service";
import { headObject } from "@/modules/storage/s3-client";
import { SEED_IDS } from "../../scripts/db-seed-data";

// PostgreSQL is real and registered; only the external object HEAD is faked.
// This verifies persisted privacy, idempotent confirmation and access checks,
// not real R2, malware scanning, or release/provider certification.
vi.mock("@/modules/storage/s3-client", () => ({
  headObject: vi.fn(),
  presignUrl: vi.fn(),
}));
vi.mock("@/modules/storage/r2-config", () => ({
  getPrivateR2Config: () => ({}),
}));

const enabled = process.env.DB10_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL);
const pool = enabled ? new Pool({
  connectionString: process.env.TEST_DATABASE_URL, max: 4,
}) : null;

const accessId = randomUUID();
const reportId = randomUUID();
const publicId = `LMS-${randomInt(100000000, 999999999)}`;
const key = `bug-tracker/${publicId}/${randomUUID()}.png`;
const request = { storageKey: key, originalFilename: "private-screen.png" };

const scopedAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
  },
};
const otherCollegeAdmin: RequestContext = {
  ...scopedAdmin,
  adminScope: {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeB,
  },
};
const notSuperAdmin: RequestContext = {
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

describe.skipIf(!enabled)("DB19-P28 admin attachment confirmation on registered PG17", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PG17 is required");
    const version = await pool.query<{ server_version_num: string }>(
      "show server_version_num",
    );
    expect(Number(version.rows[0]?.server_version_num)).toBeGreaterThanOrEqual(170000);
    const tables = await pool.query<{ reports: string | null; attachments: string | null }>(
      "select to_regclass('public.bug_reports')::text as reports, " +
        "to_regclass('public.bug_report_attachments')::text as attachments",
    );
    expect(tables.rows[0]).toMatchObject({
      reports: "bug_reports", attachments: "bug_report_attachments",
    });
    await pool.query(
      "insert into bug_tracker_access (id, display_name, token_hash, access_role, active) " +
        "values ($1, 'P28 reporter', $2, 'REPORTER', true)",
      [accessId, randomBytes(32).toString("hex")],
    );
    await pool.query(
      "insert into bug_reports (id, public_id, reporter_access_id, college_id, " +
        "reporter_name, account_role, environment, page, issue_type, description, severity) " +
        "values ($1, $2, $3, $4, 'P28 reporter', 'COLLEGE_ADMIN', 'UAT', " +
        "'/college/people', 'FUNCTIONAL', 'P28 metadata redaction', 'MAJOR')",
      [reportId, publicId, accessId, SEED_IDS.collegeA],
    );
  });

  beforeEach(() => {
    vi.mocked(headObject).mockReset();
    vi.mocked(headObject).mockResolvedValue({
      etag: "private-etag",
      lastModifiedMs: Date.now(),
      sizeBytes: 128,
      contentType: "image/png",
      metadata: {
        "malware-scan-status": "CLEAN",
        "scan-attested-by": "lms-vnext-privileged-scanner",
        sha256: "a".repeat(64),
      },
    });
  });

  afterAll(async () => {
    if (!pool) return;
    try {
      await pool.query("delete from bug_report_attachments where bug_report_id=$1", [reportId]);
      await pool.query("delete from bug_report_activities where bug_report_id=$1", [reportId]);
      await pool.query(
        "delete from activity_events where subject_type='bug_report' and subject_id=$1",
        [reportId],
      );
      await pool.query("delete from bug_reports where id=$1", [reportId]);
      await pool.query("delete from bug_tracker_sessions where access_id=$1", [accessId]);
      await pool.query("delete from bug_tracker_access where id=$1", [accessId]);
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  });

  it("persists a private key but does not return it on first confirmation or replay", async () => {
    if (!pool) throw new Error("Disposable PG17 is required");
    const first = await confirmTrackerAttachment(scopedAdmin, publicId, request);
    expect(first.replayed).toBe(false);
    expect(first.attachment).toMatchObject({
      originalFilename: "private-screen.png",
      contentType: "image/png",
      sizeBytes: 128,
    });
    expect(first.attachment).not.toHaveProperty("storageKey");

    const replay = await confirmTrackerAttachment(scopedAdmin, publicId, request);
    expect(replay.replayed).toBe(true);
    expect(replay.attachment.id).toBe(first.attachment.id);
    expect(replay.attachment).not.toHaveProperty("storageKey");
    expect(JSON.stringify({ first, replay })).not.toContain(key);

    const rows = await pool.query<{ storage_key: string; total: number }>(
      "select storage_key, count(*) over()::int as total " +
        "from bug_report_attachments where bug_report_id=$1",
      [reportId],
    );
    expect(rows.rows).toEqual([{ storage_key: key, total: 1 }]);
  });

  it("rejects changed-tenant and non-super-admin access before a private object response", async () => {
    await expect(confirmTrackerAttachment(otherCollegeAdmin, publicId, request))
      .rejects.toMatchObject({ code: "ISSUE_NOT_FOUND" });
    await expect(confirmTrackerAttachment(notSuperAdmin, publicId, request))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(headObject).not.toHaveBeenCalled();
  });

  it("never confirms a mismatched issue key or untrusted scanner attestation", async () => {
    const anotherKey = `bug-tracker/LMS-999999999/${randomUUID()}.png`;
    await expect(confirmTrackerAttachment(scopedAdmin, publicId, {
      storageKey: anotherKey, originalFilename: "screen.png",
    })).rejects.toThrow("INVALID_STORAGE_KEY");

    vi.mocked(headObject).mockResolvedValue({
      etag: "private-etag",
      lastModifiedMs: Date.now(),
      sizeBytes: 128,
      contentType: "image/png",
      metadata: {
        "malware-scan-status": "CLEAN",
        "scan-attested-by": "client-controlled",
        sha256: "a".repeat(64),
      },
    });
    await expect(confirmTrackerAttachment(scopedAdmin, publicId, {
      storageKey: `bug-tracker/${publicId}/${randomUUID()}.png`,
      originalFilename: "screen.png",
    })).rejects.toThrow("TRACKER_ATTACHMENT_NOT_ATTESTED");
  });
});
