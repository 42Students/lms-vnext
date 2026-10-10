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
import { postgresScheduledJobLeaseStore } from "@/modules/operations/postgres-scheduled-job-lease-store";

const dbUrl = process.env.TEST_DATABASE_URL;
const enabled =
  process.env.DB10_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(dbUrl);
const pool = enabled ? new Pool({ connectionString: dbUrl, max: 4 }) : null;
const jobName = "w06.integration.notification.release";

async function cleanup() {
  await pool?.query(
    "delete from scheduled_job_leases where job_name like 'w06.integration.%'",
  );
}

describe.skipIf(!enabled)("W06 scheduled-job lease PostgreSQL adapter", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB10 isolated DB must be explicitly enabled");
    const result = await pool.query(
      "select to_regclass('public.scheduled_job_leases') as leases",
    );
    if (!result.rows[0]?.leases) {
      throw new Error("DB10 scheduled_job_leases draft table is not applied");
    }
  });

  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await pool?.end();
    await closeDatabaseConnection();
  });

  it("allows exactly one winner for concurrent first claims", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        postgresScheduledJobLeaseStore.acquire({
          jobName,
          holderId: `worker-${index}`,
          ttlMs: 60_000,
        }),
      ),
    );
    const winners = results.filter((lease) => lease !== null);
    expect(winners).toHaveLength(1);
    expect(winners[0]?.fence).toBe(1);

    const row = await pool!.query<{
      job_name: string;
      locked_by: string;
      fence: string;
    }>(
      "select job_name, locked_by, fence::text from scheduled_job_leases where job_name = $1",
      [jobName],
    );
    expect(row.rows).toHaveLength(1);
    expect(row.rows[0]?.job_name).toBe(jobName);
    expect(Number(row.rows[0]?.fence)).toBe(1);
  });

  it("does not let the same worker restart the same tick before expiry", async () => {
    const first = await postgresScheduledJobLeaseStore.acquire({
      jobName,
      holderId: "worker-a",
      ttlMs: 60_000,
    });
    expect(first).not.toBeNull();

    const duplicate = await postgresScheduledJobLeaseStore.acquire({
      jobName,
      holderId: "worker-a",
      ttlMs: 60_000,
    });
    expect(duplicate).toBeNull();
  });

  it("uses DB expiry for takeover and increments the fence exactly once", async () => {
    const first = await postgresScheduledJobLeaseStore.acquire({
      jobName,
      holderId: "worker-a",
      ttlMs: 60_000,
    });
    expect(first).not.toBeNull();

    await pool!.query(
      "update scheduled_job_leases set locked_until = clock_timestamp() - interval '1 second' where job_name = $1",
      [jobName],
    );

    const second = await postgresScheduledJobLeaseStore.acquire({
      jobName,
      holderId: "worker-b",
      ttlMs: 60_000,
    });
    expect(second).toMatchObject({
      jobName,
      holderId: "worker-b",
      fence: 2,
    });
    expect(await postgresScheduledJobLeaseStore.isCurrent(first!)).toBe(false);
    expect(await postgresScheduledJobLeaseStore.isCurrent(second!)).toBe(true);
  });

  it("renews only a current matching holder/fence and never advances its fence", async () => {
    const first = await postgresScheduledJobLeaseStore.acquire({
      jobName,
      holderId: "worker-a",
      ttlMs: 60_000,
    });
    expect(first).not.toBeNull();

    const renewed = await postgresScheduledJobLeaseStore.renew(first!, 120_000);
    expect(renewed).toMatchObject({
      jobName,
      holderId: "worker-a",
      fence: 1,
    });
    expect(renewed!.lockedUntil.getTime()).toBeGreaterThan(
      first!.lockedUntil.getTime(),
    );

    expect(await postgresScheduledJobLeaseStore.renew(
      { ...first!, holderId: "worker-b" },
      60_000,
    )).toBeNull();
    expect(await postgresScheduledJobLeaseStore.renew(
      { ...first!, fence: 99 },
      60_000,
    )).toBeNull();
  });

  it("rejects unsafe names/holders/TTL before touching SQL", async () => {
    await expect(postgresScheduledJobLeaseStore.acquire({
      jobName: "bad job name",
      holderId: "worker",
      ttlMs: 60_000,
    })).rejects.toThrow("INVALID_JOB_NAME");
    await expect(postgresScheduledJobLeaseStore.acquire({
      jobName,
      holderId: "worker\nforged",
      ttlMs: 60_000,
    })).rejects.toThrow("INVALID_HOLDER");
    await expect(postgresScheduledJobLeaseStore.acquire({
      jobName,
      holderId: "worker",
      ttlMs: 86_400_001,
    })).rejects.toThrow("INVALID_TTL");

    const count = await pool!.query<{ count: string }>(
      "select count(*)::text as count from scheduled_job_leases where job_name like 'w06.integration.%'",
    );
    expect(count.rows[0]?.count).toBe("0");
  });
});
