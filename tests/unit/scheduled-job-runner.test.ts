import { describe, expect, it, vi } from "vitest";
import {
  executeScheduledJobWithLease,
  type ScheduledJobLeaseStore,
} from "@/modules/operations/scheduled-job-runner";
import type { JobLease } from "@/modules/operations/scheduled-job-lease";

const input = {
  jobName: "notification.release",
  holderId: "replica-A",
  ttlMs: 300000,
};
const grant: JobLease = {
  jobName: input.jobName,
  holderId: input.holderId,
  lockedUntil: new Date("2026-10-11T00:00:00.000Z"),
  fence: 4,
};
function store(
  override: Partial<ScheduledJobLeaseStore> = {},
): ScheduledJobLeaseStore {
  return {
    acquire: vi.fn().mockResolvedValue(grant),
    isCurrent: vi.fn().mockResolvedValue(true),
    renew: vi.fn().mockResolvedValue({
      ...grant,
      lockedUntil: new Date("2026-10-11T00:05:00.000Z"),
    }),
    ...override,
  };
}

describe("DB10 worker executor with existing fenced lease", () => {
  it("acquires and verifies storage-backed ownership before job start", async () => {
    const calls: string[] = [];
    const s = store({
      acquire: vi.fn(async () => {
        calls.push("acquire");
        return grant;
      }),
      isCurrent: vi.fn(async () => {
        calls.push("check");
        return true;
      }),
      renew: vi.fn(async () => {
        calls.push("renew");
        return { ...grant, lockedUntil: new Date("2026-10-11T00:05:00.000Z") };
      }),
    });
    const result = await executeScheduledJobWithLease(
      s, input, async fence => {
        calls.push("work");
        expect(fence.lease).toMatchObject({
          jobName: input.jobName,
          holderId: input.holderId,
          fence: 4,
        });
        expect(Object.isFrozen(fence.lease)).toBe(true);
        await fence.renew();
        await fence.assertCurrent();
        return 42;
      },
    );
    expect(result).toEqual({ ran: true, result: 42 });
    expect(calls).toEqual(["acquire", "check", "work", "renew", "check"]);
  });

  it("skips a tick when another replica owns the lease", async () => {
    const s = store({ acquire: vi.fn().mockResolvedValue(null) });
    const work = vi.fn();
    await expect(executeScheduledJobWithLease(s, input, work)).resolves.toEqual({
      ran: false,
      reason: "HELD_BY_OTHER_WORKER",
    });
    expect(work).not.toHaveBeenCalled();
    expect(s.isCurrent).not.toHaveBeenCalled();
  });

  it("fails closed and redacts raw database errors on acquisition outage", async () => {
    const s = store({
      acquire: vi.fn().mockRejectedValue(new Error("postgres password=secret")),
    });
    const work = vi.fn();
    await expect(executeScheduledJobWithLease(s, input, work))
      .rejects.toMatchObject({
        name: "ScheduledJobRunnerError",
        code: "LEASE_STORE_UNAVAILABLE",
      });
    expect(work).not.toHaveBeenCalled();
  });

  it("does not start a job if the DB check reports expiration", async () => {
    const s = store({ isCurrent: vi.fn().mockResolvedValue(false) });
    const work = vi.fn();
    await expect(executeScheduledJobWithLease(s, input, work))
      .rejects.toMatchObject({ code: "LEASE_LOST" });
    expect(work).not.toHaveBeenCalled();
  });

  it("aborts a running worker when a later check loses ownership", async () => {
    const s = store({
      isCurrent: vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    });
    await expect(executeScheduledJobWithLease(s, input, async fence => {
      await fence.assertCurrent();
    })).rejects.toMatchObject({ code: "LEASE_LOST" });
  });

  it("does not silently revive an expired lease after failed renewal", async () => {
    const s = store({ renew: vi.fn().mockResolvedValue(null) });
    await expect(executeScheduledJobWithLease(s, input, async fence => {
      await fence.renew();
    })).rejects.toMatchObject({ code: "LEASE_LOST" });
  });

  it("rejects renewal returned with a different fencing token", async () => {
    const s = store({
      renew: vi.fn().mockResolvedValue({ ...grant, fence: 5 }),
    });
    await expect(executeScheduledJobWithLease(s, input, async fence => {
      await fence.renew();
    })).rejects.toMatchObject({ code: "INVALID_LEASE_GRANT" });
  });

  it("never masks task failures or releases a job lease early", async () => {
    const s = store();
    const error = new Error("provider failed");
    await expect(executeScheduledJobWithLease(s, input, async () => {
      throw error;
    })).rejects.toBe(error);
    expect("release" in s).toBe(false);
  });

  it.each([
    { jobName: "", holderId: "worker", ttlMs: 30000 },
    { jobName: "notification.release;drop", holderId: "worker", ttlMs: 30000 },
    { jobName: "job", holderId: "", ttlMs: 30000 },
    { jobName: "job", holderId: "worker\nother", ttlMs: 30000 },
    { jobName: "job", holderId: "worker", ttlMs: 0 },
    { jobName: "job", holderId: "worker", ttlMs: 86_400_001 },
    { jobName: "job", holderId: "worker", ttlMs: Number.NaN },
  ])("rejects unsafe lease acquisition requests %#", async bad => {
    const s = store();
    await expect(executeScheduledJobWithLease(s, bad, vi.fn()))
      .rejects.toMatchObject({ code: "INVALID_JOB_INPUT" });
    expect(s.acquire).not.toHaveBeenCalled();
  });

  it.each([
    { ...grant, holderId: "other" },
    { ...grant, jobName: "notification.cleanup" },
    { ...grant, fence: 0 },
    { ...grant, lockedUntil: new Date("bad date") },
  ])("rejects malformed or wrong-owner DB lease grants %#", async wrong => {
    const s = store({ acquire: vi.fn().mockResolvedValue(wrong) });
    const work = vi.fn();
    await expect(executeScheduledJobWithLease(s, input, work))
      .rejects.toMatchObject({ code: "INVALID_LEASE_GRANT" });
    expect(work).not.toHaveBeenCalled();
  });
});
