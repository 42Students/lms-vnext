import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import {
  assertPostgresScheduledJobLeaseReady,
  postgresScheduledJobLeaseStore as store,
} from "@/modules/operations/postgres-scheduled-job-lease-store";

/**
 * DB018/P5-R08. Registered migration 0133 already owns the DB-clock fenced
 * scheduled_job_leases table. Unlike the old source-only inventory, this
 * race executes both app-service writers against disposable PostgreSQL 17.
 * It cannot operate against an application DB or a non *_test endpoint.
 */
const enabled = process.env["DB018_ISOLATED_TEST_DATABASE"] === "1" &&
  Boolean(process.env["TEST_DATABASE_URL"]) &&
  process.env["DATABASE_URL"] === process.env["TEST_DATABASE_URL"];
const pool = enabled ? new Pool({
  connectionString: process.env["TEST_DATABASE_URL"], max: 4,
}) : null;

afterAll(async () => {
  await pool?.end();
  if (enabled) await closeDatabaseConnection();
});

describe.skipIf(!enabled)("DB018 P5-R08 registered PG17 scheduled-job fencing", () => {
  it("only one of two competing takeovers can win, and the stale fence can never renew", async () => {
    assertDb018DisposableTarget(process.env, { serviceBound: true });
    if (!pool) throw new Error("Disposable PostgreSQL pool missing");
    await assertPostgresScheduledJobLeaseReady();
    const jobName = "db18.r08." + randomUUID().replaceAll("-", "");
    const first = await store.acquire({
      jobName, holderId: "db18-initial", ttlMs: 120_000,
    });
    expect(first).not.toBeNull();
    expect(first?.fence).toBe(1);
    const lockHolder = await pool.connect();
    let transactionOpen = false;
    try {
      await lockHolder.query("BEGIN");
      transactionOpen = true;
      await lockHolder.query(
        "update scheduled_job_leases set locked_until=clock_timestamp()-interval '1 second' where job_name=$1",
        [jobName],
      );
      const writes = ["db18-contender-A", "db18-contender-B"].map((holderId) =>
        store.acquire({ jobName, holderId, ttlMs: 120_000 }),
      );
      let bothBlocked = false;
      try {
        const deadline = Date.now() + 10_000;
        while (Date.now() < deadline) {
          const waiting = await pool.query<{blocked: string}>(`
            select count(*)::text as blocked from pg_stat_activity
             where datname=current_database() and pid<>pg_backend_pid()
               and wait_event_type='Lock'
               and query ilike '%scheduled_job_leases%'`);
          if (Number(waiting.rows[0]?.blocked ?? 0) >= 2) {
            bothBlocked = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 25));
        }
      } finally {
        // No latch/timing assertion may leave other writers blocked.
        await lockHolder.query("COMMIT");
        transactionOpen = false;
      }
      const outcomes = await Promise.allSettled(writes);
      expect(bothBlocked, "Two independent service writers must reach the held PostgreSQL row").toBe(true);
      expect(outcomes.every(x => x.status === "fulfilled")).toBe(true);
      const leases = outcomes.flatMap(x => x.status === "fulfilled" && x.value ? [x.value] : []);
      expect(leases).toHaveLength(1);
      const winner = leases[0]!;
      expect(winner.fence).toBe(first!.fence + 1);
      expect(["db18-contender-A", "db18-contender-B"]).toContain(winner.holderId);
      const persisted = await pool.query<{
        locked_by:string;fence:string;valid:boolean;
      }>(`select locked_by, fence::text,
              locked_until > clock_timestamp() as valid
             from scheduled_job_leases where job_name=$1`, [jobName]);
      expect(persisted.rows).toHaveLength(1);
      expect(persisted.rows[0]).toMatchObject({
        locked_by:winner.holderId,fence:String(winner.fence),valid:true,
      });
      expect(await store.isCurrent(first!)).toBe(false);
      expect(await store.renew(first!, 120_000)).toBeNull();
      expect(await store.acquire({
        jobName, holderId:"db18-unsolicited-third",ttlMs:120_000,
      })).toBeNull();
      expect(await store.isCurrent(winner)).toBe(true);
      const renewed = await store.renew(winner, 120_000);
      expect(renewed).not.toBeNull();
      expect(renewed?.fence).toBe(winner.fence);
      expect(renewed?.holderId).toBe(winner.holderId);
    } finally {
      if (transactionOpen) await lockHolder.query("ROLLBACK").catch(() => {});
      lockHolder.release();
      await pool.query("delete from scheduled_job_leases where job_name=$1", [jobName]);
    }
  });
});
