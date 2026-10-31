import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import {
  createAnnouncement, deleteAnnouncement, restoreAnnouncement, updateAnnouncement,
} from "@/modules/announcements/service";
import { createBugTrackerIssueForAdmin } from "@/modules/bug-tracker/report-service";
import { updateBugTrackerWorkflowForAdmin } from "@/modules/bug-tracker/admin-service";

// These tests never fall back to an application database. PostgreSQL 17 must
// have replayed the registered Drizzle journal including migration 0076.
const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB018_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({
  connectionString: process.env.TEST_DATABASE_URL, max: 4,
}) : null;

function pg(): Pool {
  if (!pool) throw new Error("P5-R18/R19 require a disposable PostgreSQL target");
  return pool;
}

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
const superAdmin: RequestContext = {
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

const announcements: string[] = [];
const bugReports: string[] = [];
let reporterName = "";

type SettledWriter =
  | { ok: true; value: unknown }
  | { ok: false; error: unknown };

async function observeBlockedWriters(table: "announcements" | "bug_reports") {
  const deadline = Date.now() + 12_000;
  let count = 0;
  while (Date.now() < deadline) {
    const observed = await pg().query<{ waiting: string }>(
      "select count(*)::text as waiting from pg_stat_activity " +
      "where datname = current_database() and pid <> pg_backend_pid() " +
      "and wait_event_type = 'Lock' and query ilike $1",
      ["%" + table + "%"],
    );
    count = Number(observed.rows[0]?.waiting ?? 0);
    if (count >= 2) break;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return count;
}

/**
 * Two real service producers must reach the SAME PostgreSQL locked row before
 * either can commit. Unlike Promise.all alone, this proves the TOCTOU/CAS
 * contention window. The blocker is released even if polling fails.
 */
async function compete(
  table: "announcements" | "bug_reports",
  id: string,
  writers: [() => Promise<unknown>, () => Promise<unknown>],
): Promise<[SettledWriter, SettledWriter]> {
  const blocker: PoolClient = await pg().connect();
  let inTransaction = false;
  try {
    await blocker.query("BEGIN");
    inTransaction = true;
    await blocker.query(
      "select id from " + table + " where id = $1 for update",
      [id],
    );
    const pending = writers.map((writer) =>
      Promise.resolve().then(writer).then(
        (value): SettledWriter => ({ ok: true, value }),
        (error: unknown): SettledWriter => ({ ok: false, error }),
      ),
    );
    const waiting = await observeBlockedWriters(table);
    await blocker.query("COMMIT");
    inTransaction = false;
    const results = await Promise.all(pending);
    expect(waiting, "Both producers must reach the PostgreSQL row lock").toBeGreaterThanOrEqual(2);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toHaveLength(1);
    expect(results.find((result) => !result.ok))
      .toMatchObject({ ok: false, error: { code: "STALE_VERSION" } });
    return results as [SettledWriter, SettledWriter];
  } finally {
    if (inTransaction) await blocker.query("ROLLBACK").catch(() => undefined);
    blocker.release();
  }
}

async function createNotice() {
  const created = await createAnnouncement(collegeAdmin, {
    receiverType: "COLLEGE",
    receiverId: SEED_IDS.collegeA,
    title: "DB18 R18 race notice",
    message: "original",
  });
  announcements.push(created.id);
  expect(created.version).toBe(0);
  return created;
}

beforeAll(async () => {
  if (!enabled) return;
  const version = await pg().query<{ server_version_num: string }>(
    "show server_version_num",
  );
  expect(Number(version.rows[0]?.server_version_num)).toBeGreaterThanOrEqual(170000);
  const tables = await pg().query<{ announcement: string | null; tracker: string | null }>(
    "select to_regclass('public.announcements')::text as announcement, " +
    "to_regclass('public.bug_reports')::text as tracker",
  );
  expect(tables.rows[0]?.announcement).toBe("announcements");
  expect(tables.rows[0]?.tracker).toBe("bug_reports");
  const user = await pg().query<{ display_name: string | null }>(
    "select display_name from users where id=$1 and platform_status='ACTIVE'",
    [SEED_IDS.superAdminUser],
  );
  reporterName = user.rows[0]?.display_name?.trim() ?? "";
  expect(reporterName.length).toBeGreaterThan(0);
});

afterAll(async () => {
  if (!pool) return;
  try {
    for (const publicId of bugReports) {
      const report = await pool.query<{ id: string }>(
        "select id from bug_reports where public_id=$1", [publicId],
      );
      for (const item of report.rows) {
        await pool.query(
          "delete from bug_report_activities where bug_report_id=$1", [item.id],
        );
        await pool.query("delete from bug_reports where id=$1", [item.id]);
      }
    }
    for (const id of announcements) {
      await pool.query("delete from announcements where id=$1", [id]);
    }
  } finally {
    await pool.end();
    await closeDatabaseConnection();
  }
});

describe.skipIf(!enabled)("DB-018 P5-R18/R19 registered PG17 shared-ops races", () => {
  it("P5-R18: edit/edit and edit/delete each allow only one versioned announcement writer", async () => {
    const edited = await createNotice();
    const edits = await compete("announcements", edited.id, [
      () => updateAnnouncement(collegeAdmin, edited.id, {
        expectedVersion: edited.version, message: "writer A",
      }),
      () => updateAnnouncement(collegeAdmin, edited.id, {
        expectedVersion: edited.version, message: "writer B",
      }),
    ]);
    const editRow = await pg().query<{
      message: string; version: number; deleted_at: Date | null;
    }>(
      "select message,version,deleted_at from announcements where id=$1", [edited.id],
    );
    expect(editRow.rows).toHaveLength(1);
    expect(editRow.rows[0]?.version).toBe(1);
    expect(editRow.rows[0]?.deleted_at).toBeNull();
    expect(editRow.rows[0]?.message).toBe(edits[0].ok ? "writer A" : "writer B");

    const deleted = await createNotice();
    const crossing = await compete("announcements", deleted.id, [
      () => updateAnnouncement(collegeAdmin, deleted.id, {
        expectedVersion: deleted.version, message: "edited on the winner branch",
      }),
      () => deleteAnnouncement(collegeAdmin, deleted.id, {
        expectedVersion: deleted.version,
      }),
    ]);
    const crossedRow = await pg().query<{
      message: string; version: number; deleted_at: Date | null;
    }>(
      "select message,version,deleted_at from announcements where id=$1", [deleted.id],
    );
    expect(crossedRow.rows).toHaveLength(1);
    expect(crossedRow.rows[0]?.version).toBe(1);
    if (crossing[0].ok) {
      expect(crossedRow.rows[0]).toMatchObject({
        message: "edited on the winner branch", deleted_at: null,
      });
    } else {
      expect(crossedRow.rows[0]?.message).toBe("original");
      expect(crossedRow.rows[0]?.deleted_at).toBeInstanceOf(Date);
    }
  });

  it("P5-R18: concurrent restores cannot resurrect a stale deletion or increment twice", async () => {
    const notice = await createNotice();
    const deleted = await deleteAnnouncement(collegeAdmin, notice.id, {
      expectedVersion: 0,
    });
    expect(deleted.version).toBe(1);
    await compete("announcements", notice.id, [
      () => restoreAnnouncement(collegeAdmin, notice.id, { expectedVersion: 1 }),
      () => restoreAnnouncement(collegeAdmin, notice.id, { expectedVersion: 1 }),
    ]);
    const state = await pg().query<{ version: number; deleted_at: Date | null }>(
      "select version,deleted_at from announcements where id=$1", [notice.id],
    );
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0]).toMatchObject({ version: 2, deleted_at: null });
    // Delete against the version that existed before the competing restores
    // must fail. DELETE on an already deleted row is intentionally idempotent.
    await expect(deleteAnnouncement(collegeAdmin, notice.id, {
      expectedVersion: 1,
    })).rejects.toMatchObject({ code: "STALE_VERSION" });
  });

  it("P5-R18: restore and idempotent delete overlap on the same prior revision", async () => {
    const notice = await createNotice();
    const deleted = await deleteAnnouncement(collegeAdmin, notice.id, {
      expectedVersion: 0,
    });
    expect(deleted.version).toBe(1);
    const blocker = await pg().connect();
    let inTransaction = false;
    try {
      await blocker.query("BEGIN");
      inTransaction = true;
      await blocker.query(
        "select id from announcements where id=$1 for update", [notice.id],
      );
      const restoration = Promise.resolve().then(() =>
        restoreAnnouncement(collegeAdmin, notice.id, { expectedVersion: 1 }),
      ).then(
        (value) => ({ ok: true as const, value }),
        (error: unknown) => ({ ok: false as const, error }),
      );
      // The restoration is a real writer blocked at its row-level CAS,
      // while a duplicate DELETE is intentionally an idempotent no-op on
      // an already-deleted version. No second version increment is allowed.
      const deadline = Date.now() + 8_000;
      let waiting = 0;
      while (Date.now() < deadline) {
        const observed = await pg().query<{ waiting: string }>(
          "select count(*)::text as waiting from pg_stat_activity " +
          "where datname=current_database() and pid<>pg_backend_pid() " +
          "and wait_event_type='Lock' and query ilike '%announcements%'",
        );
        waiting = Number(observed.rows[0]?.waiting ?? 0);
        if (waiting >= 1) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(waiting, "The restoration must reach the blocked PostgreSQL row").toBeGreaterThanOrEqual(1);
      const duplicateDelete = await deleteAnnouncement(collegeAdmin, notice.id, {
        expectedVersion: 1,
      });
      expect(duplicateDelete.version).toBe(1);
      expect(duplicateDelete.deletedAt).toBeInstanceOf(Date);
      await blocker.query("COMMIT");
      inTransaction = false;
      const outcome = await restoration;
      expect(outcome.ok).toBe(true);
      if (outcome.ok) {
        expect(outcome.value.version).toBe(2);
        expect(outcome.value.deletedAt).toBeNull();
      }
    } finally {
      if (inTransaction) await blocker.query("ROLLBACK").catch(() => undefined);
      blocker.release();
    }
    const final = await pg().query<{ version: number; deleted_at: Date | null }>(
      "select version,deleted_at from announcements where id=$1", [notice.id],
    );
    expect(final.rows).toEqual([{ version: 2, deleted_at: null }]);
    // The delete that was idempotent before restore is stale afterward.
    await expect(deleteAnnouncement(collegeAdmin, notice.id, {
      expectedVersion: 1,
    })).rejects.toMatchObject({ code: "STALE_VERSION" });
  }, 60_000);

  it("P5-R19: competing workflow transitions preserve exactly one immutable activity per committed CAS", async () => {
    const created = await createBugTrackerIssueForAdmin(superAdmin, {
      reporterName,
      accountRole: "LEARNER",
      environment: "UAT",
      page: "Projects",
      screen: "Workspaces",
      section: "Members",
      issueType: "Wrong Data",
      severity: "MAJOR",
      description: "DB18-R19 real two-writer regression fixture",
    });
    bugReports.push(created.publicId);
    const initial = await pg().query<{ id: string; version: number; status: string }>(
      "select id,version,status from bug_reports where public_id=$1",
      [created.publicId],
    );
    expect(initial.rows).toHaveLength(1);
    expect(initial.rows[0]).toMatchObject({ version: 0, status: "NEW" });
    const reportId = initial.rows[0]!.id;

    await compete("bug_reports", reportId, [
      () => updateBugTrackerWorkflowForAdmin(superAdmin, created.publicId, {
        expectedVersion: 0, status: "CHECKING",
      }),
      () => updateBugTrackerWorkflowForAdmin(superAdmin, created.publicId, {
        expectedVersion: 0, status: "FIXING",
      }),
    ]);

    const firstState = await pg().query<{
      version: number; status: string; fix_notes: string | null;
    }>(
      "select version,status,fix_notes from bug_reports where id=$1", [reportId],
    );
    expect(firstState.rows).toHaveLength(1);
    expect(firstState.rows[0]?.version).toBe(1);
    expect(["CHECKING", "FIXING"]).toContain(firstState.rows[0]?.status);
    expect(firstState.rows[0]?.fix_notes).toBeNull();
    const firstEvents = await pg().query<{
      activity_type: string; from_value: string | null; to_value: string | null;
    }>(
      "select activity_type,from_value,to_value from bug_report_activities " +
      "where bug_report_id=$1 order by created_at,id",
      [reportId],
    );
    expect(firstEvents.rows).toHaveLength(2);
    expect(firstEvents.rows[0]?.activity_type).toBe("CREATED");
    expect(firstEvents.rows[1]).toMatchObject({
      activity_type: "STATUS_CHANGED",
      from_value: "NEW",
      to_value: firstState.rows[0]!.status,
    });

    await compete("bug_reports", reportId, [
      () => updateBugTrackerWorkflowForAdmin(superAdmin, created.publicId, {
        expectedVersion: 1, status: "READY_FOR_RETEST",
      }),
      () => updateBugTrackerWorkflowForAdmin(superAdmin, created.publicId, {
        expectedVersion: 1, fixNotes: "Only the winning metadata change may persist",
      }),
    ]);
    const finalState = await pg().query<{
      version: number; status: string; fix_notes: string | null;
    }>(
      "select version,status,fix_notes from bug_reports where id=$1", [reportId],
    );
    expect(finalState.rows[0]?.version).toBe(2);
    const finalEvents = await pg().query<{
      activity_type: string; from_value: string | null; to_value: string | null;
    }>(
      "select activity_type,from_value,to_value from bug_report_activities " +
      "where bug_report_id=$1 order by created_at,id",
      [reportId],
    );
    expect(finalEvents.rows).toHaveLength(3);
    if (finalState.rows[0]?.status === "READY_FOR_RETEST") {
      expect(finalState.rows[0]?.fix_notes).toBeNull();
      expect(finalEvents.rows[2]).toMatchObject({
        activity_type: "STATUS_CHANGED",
        from_value: firstState.rows[0]!.status,
        to_value: "READY_FOR_RETEST",
      });
    } else {
      expect(finalState.rows[0]?.status).toBe(firstState.rows[0]?.status);
      expect(finalState.rows[0]?.fix_notes).toBe(
        "Only the winning metadata change may persist",
      );
      expect(finalEvents.rows[2]?.activity_type).toBe("WORKFLOW_UPDATED");
    }
    // A crossed-college Super Admin view cannot read the same report.
    await expect(updateBugTrackerWorkflowForAdmin({
      ...superAdmin,
      adminScope: {
        organizationId: SEED_IDS.organization,
        collegeId: SEED_IDS.collegeB,
      },
    }, created.publicId, { expectedVersion: 2, status: "CLOSED" }))
      .rejects.toMatchObject({ code: "ISSUE_NOT_FOUND" });
    const persisted = await pg().query<{ version: number }>(
      "select version from bug_reports where id=$1", [reportId],
    );
    expect(persisted.rows[0]?.version).toBe(2);
  });
});
