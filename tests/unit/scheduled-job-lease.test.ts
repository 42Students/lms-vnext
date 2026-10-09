import { describe, expect, it } from "vitest";
import {
  proposeJobLeaseClaim,
  proposeJobLeaseRenewal,
  isCurrentJobLease,
} from "@/modules/operations/scheduled-job-lease";

const t0 = new Date("2026-10-10T09:00:00.000Z");
const attempt = { jobName: "notification.release", holderId: "worker-A", now: t0, ttlMs: 300000 };

describe("DB10 safe scheduled job lease proposal", () => {
  it("initial claim starts fence 1 and expires after the exact TTL", () => {
    const result = proposeJobLeaseClaim(null, attempt);
    expect(result.acquired).toBe(true);
    if (!result.acquired) throw new Error("expected initial claim");
    expect(result.lease.fence).toBe(1);
    expect(result.lease.lockedUntil).toEqual(new Date(t0.getTime() + 300000));
  });

  it("second worker and same worker cannot restart before expiry", () => {
    const first = proposeJobLeaseClaim(null, attempt);
    if (!first.acquired) throw new Error("initial claim failed");
    for (const holderId of ["worker-A", "worker-B"]) {
      const blocked = proposeJobLeaseClaim(first.lease, {
        ...attempt, holderId, now: new Date(t0.getTime() + 1000),
      });
      expect(blocked.acquired).toBe(false);
      expect(blocked.lease.fence).toBe(1);
    }
  });

  it("expired claim changes holder and advances fence; old owner is fenced out", () => {
    const first = proposeJobLeaseClaim(null, attempt);
    if (!first.acquired) throw new Error("initial claim failed");
    const next = proposeJobLeaseClaim(first.lease, {
      ...attempt, holderId: "worker-B", now: first.lease.lockedUntil,
    });
    expect(next.acquired).toBe(true);
    if (!next.acquired) throw new Error("expected expired takeover");
    expect(next.lease.fence).toBe(2);
    expect(isCurrentJobLease(next.lease, attempt.jobName, "worker-A", 1, next.lease.lockedUntil)).toBe(false);
    expect(isCurrentJobLease(next.lease, attempt.jobName, "worker-B", 2, new Date(t0.getTime() + 300001))).toBe(true);
  });

  it("renewal only succeeds by matching current holder/fence before expiration", () => {
    const claimed = proposeJobLeaseClaim(null, attempt);
    if (!claimed.acquired) throw new Error("claim failed");
    const now = new Date(t0.getTime() + 10000);
    expect(proposeJobLeaseRenewal(claimed.lease, "worker-B", 1, now, 300000)).toBeNull();
    expect(proposeJobLeaseRenewal(claimed.lease, "worker-A", 0, now, 300000)).toBeNull();
    expect(proposeJobLeaseRenewal(claimed.lease, "worker-A", 1, claimed.lease.lockedUntil, 300000)).toBeNull();
    const renewed = proposeJobLeaseRenewal(claimed.lease, "worker-A", 1, now, 300000);
    expect(renewed?.lockedUntil).toEqual(new Date(now.getTime() + 300000));
    expect(renewed?.fence).toBe(1);
  });

  it("rejects invalid job name, bad TTL, bad snapshot and unknown timestamp", () => {
    for (const input of [
      { ...attempt, jobName: "" },
      { ...attempt, jobName: "a".repeat(121) },
      { ...attempt, ttlMs: 0 },
      { ...attempt, ttlMs: -1 },
      { ...attempt, ttlMs: 1.5 },
      { ...attempt, now: new Date(Number.NaN) },
    ]) {
      expect(() => proposeJobLeaseClaim(null, input)).toThrow("INVALID_LEASE_INPUT");
    }
    expect(() => proposeJobLeaseClaim({
      jobName: attempt.jobName,
      holderId: "worker-A",
      fence: 0,
      lockedUntil: t0,
    }, attempt)).toThrow("INVALID_LEASE_INPUT");
  });
});
