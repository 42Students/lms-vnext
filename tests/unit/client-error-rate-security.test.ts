import { beforeEach, describe, expect, it } from "vitest";
import {
  acceptClientErrorRate,
  resetClientErrorRateForTests,
} from "@/modules/log-alerts/client-report";

describe("authenticated browser-error telemetry saturation", () => {
  beforeEach(() => resetClientErrorRateForTests());

  it("preserves active per-user quotas after 5,000 unique identities fill memory", () => {
    expect(acceptClientErrorRate("protected", 1_000, 1)).toBe(true);
    for (let i = 0; i < 4_999; i++) {
      expect(acceptClientErrorRate(`flood-${i}`, 1_000, 1)).toBe(true);
    }
    // Never evict the first living user just to admit the 5,001st identity.
    expect(acceptClientErrorRate("flood-over-capacity", 1_001, 1)).toBe(false);
    expect(acceptClientErrorRate("protected", 1_002, 1)).toBe(false);
    expect(acceptClientErrorRate("flood-4998", 1_003, 1)).toBe(false);
  });

  it("retains fair budgets for known identities under saturation", () => {
    expect(acceptClientErrorRate("known", 1_000, 2)).toBe(true);
    for (let i = 0; i < 4_999; i++) {
      expect(acceptClientErrorRate(`bucket-${i}`, 1_000, 1)).toBe(true);
    }
    expect(acceptClientErrorRate("new", 1_001, 1)).toBe(false);
    expect(acceptClientErrorRate("known", 1_002, 2)).toBe(true);
    expect(acceptClientErrorRate("known", 1_003, 2)).toBe(false);
  });

  it("reclaims only expired quotas and admits new identities after expiry", () => {
    for (let i = 0; i < 5_000; i++) {
      expect(acceptClientErrorRate(`old-${i}`, 1_000, 1)).toBe(true);
    }
    expect(acceptClientErrorRate("new", 1_001, 1)).toBe(false);
    expect(acceptClientErrorRate("new", 61_001, 1)).toBe(true);
    expect(acceptClientErrorRate("new", 61_002, 1)).toBe(false);
  });

  it("never reclaims a still-live bucket while removing expired ones", () => {
    for (let i = 0; i < 4_999; i++) {
      expect(acceptClientErrorRate(`stale-${i}`, 1_000, 1)).toBe(true);
    }
    expect(acceptClientErrorRate("still-live", 50_000, 1)).toBe(true);
    expect(acceptClientErrorRate("new", 61_001, 1)).toBe(true);
    expect(acceptClientErrorRate("still-live", 61_002, 1)).toBe(false);
  });

  it("rejects invalid inputs without growing the quota table", () => {
    expect(acceptClientErrorRate("", 1_000, 1)).toBe(false);
    expect(acceptClientErrorRate("bad", Number.NaN, 1)).toBe(false);
    expect(acceptClientErrorRate("bad", Number.POSITIVE_INFINITY, 1)).toBe(false);
    expect(acceptClientErrorRate("bad", 1_000, 0)).toBe(false);
    expect(acceptClientErrorRate("bad", 1_000, 1.1)).toBe(false);
    expect(acceptClientErrorRate("ok", 1_000, 1)).toBe(true);
  });

  it("isolates repeated test cases without a leaky process-global counter", () => {
    expect(acceptClientErrorRate("same", 1, 1)).toBe(true);
    resetClientErrorRateForTests();
    expect(acceptClientErrorRate("same", 1, 1)).toBe(true);
  });
});
