import { describe, expect, it, vi } from "vitest";
import {
  runFencedLogAlertTask,
} from "@/modules/log-alerts/scheduler";
import type {
  ScheduledJobLeaseStore,
} from "@/modules/operations/scheduled-job-runner";
import type { JobLease } from "@/modules/operations/scheduled-job-lease";
import { readFileSync } from "node:fs";

const jobName = "telegram-cloud-log-poll-PRODUCTION";
const expiry = new Date("2099-11-01T00:03:00.000Z");

function fakeStore(overrides: Partial<ScheduledJobLeaseStore> = {}): ScheduledJobLeaseStore {
  return {
    acquire: vi.fn(async (input: { jobName: string; holderId: string; ttlMs: number }) => ({
      jobName: input.jobName,
      holderId: input.holderId,
      lockedUntil: expiry,
      fence: 2,
    } satisfies JobLease)),
    isCurrent: vi.fn(async () => true),
    renew: vi.fn(async (lease: JobLease) => ({ ...lease, lockedUntil: expiry })),
    ...overrides,
  };
}

describe("DB19-P29 log-alert scheduler uses the shared database-fenced lease", () => {
  it("checks stored ownership before AND after work; never releases a lease early", async () => {
    const order: string[] = [];
    const store = fakeStore({
      acquire: vi.fn(async (input: { jobName: string; holderId: string; ttlMs: number }) => {
        order.push("claim");
        return {
          jobName: input.jobName,
          holderId: input.holderId,
          lockedUntil: expiry,
          fence: 2,
        };
      }),
      isCurrent: vi.fn(async () => {
        order.push("check");
        return true;
      }),
    });
    await expect(runFencedLogAlertTask(store, jobName, async guard => {
      order.push("work");
      expect(guard.lease.jobName).toBe(jobName);
      expect(guard.lease.fence).toBe(2);
    })).resolves.toBe(true);
    expect(order).toEqual(["claim", "check", "work", "check"]);
    expect("release" in store).toBe(false);
  });

  it("does not execute when another worker still holds a lease", async () => {
    const store = fakeStore({ acquire: vi.fn(async () => null) });
    const work = vi.fn();
    await expect(runFencedLogAlertTask(store, jobName, work)).resolves.toBe(false);
    expect(work).not.toHaveBeenCalled();
    expect(store.isCurrent).not.toHaveBeenCalled();
  });

  it("fails closed without leaking SQL secrets when the database is down", async () => {
    const store = fakeStore({
      acquire: vi.fn(async () => { throw new Error("database password=super-secret"); }),
    });
    const work = vi.fn();
    await expect(runFencedLogAlertTask(store, jobName, work))
      .rejects.toMatchObject({ code: "LEASE_STORE_UNAVAILABLE", message: "LEASE_STORE_UNAVAILABLE" });
    expect(work).not.toHaveBeenCalled();
  });

  it("never starts work on an expired or stolen grant", async () => {
    const store = fakeStore({ isCurrent: vi.fn(async () => false) });
    const work = vi.fn();
    await expect(runFencedLogAlertTask(store, jobName, work))
      .rejects.toMatchObject({ code: "LEASE_LOST" });
    expect(work).not.toHaveBeenCalled();
  });

  it("cannot report success if the lease is stolen during a tick", async () => {
    const store = fakeStore({
      isCurrent: vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    });
    const work = vi.fn(async () => undefined);
    await expect(runFencedLogAlertTask(store, jobName, work))
      .rejects.toMatchObject({ code: "LEASE_LOST" });
    expect(work).toHaveBeenCalledOnce();
  });

  it("generates a fresh holder token for each invocation", async () => {
    const holders: string[] = [];
    const store = fakeStore({
      acquire: vi.fn(async (input: { jobName: string; holderId: string; ttlMs: number }) => {
        holders.push(input.holderId);
        return { ...input, lockedUntil: expiry, fence: 1 };
      }),
    });
    await runFencedLogAlertTask(store, jobName, async () => {});
    await runFencedLogAlertTask(store, jobName, async () => {});
    expect(holders).toHaveLength(2);
    expect(holders[0]).not.toBe(holders[1]);
  });

  it("does not regress to a local-clock lease or eager-release implementation", () => {
    const source = readFileSync("src/modules/log-alerts/scheduler.ts", "utf8");
    const part = source.slice(
      source.indexOf("export async function runFencedLogAlertTask("),
      source.indexOf("/** Subsequent burst errors"),
    );
    expect(part).toContain("executeScheduledJobWithLease(store");
    expect(part).toContain("postgresScheduledJobLeaseStore");
    expect(part).not.toContain("lockedUntil: new Date");
    expect(part).not.toContain("lockedUntil: now");
    expect(part).not.toContain("finally {");
  });
});
