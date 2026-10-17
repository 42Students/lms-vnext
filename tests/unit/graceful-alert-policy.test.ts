import { describe, it, expect } from "vitest";
import { burstSlot, countSuppressedOccurrence, decideAlert, reopenRegressedSignature } from "@/modules/log-alerts/policy";

const now = new Date("2099-06-10T00:00:00.000Z");
const base = { known: true, muted: false, fixStatus: "OPEN", fixedAt: null,
  recentCount: 1, lastSpikeAt: null, now };

describe("Graceful Telegram error policy", () => {
  it("GR-116 GR-118 GR-125 retries undelivered new signatures without multiplying burst overflow", () => {
    expect(burstSlot(5)).toBe("SUPPRESS");
    expect(countSuppressedOccurrence(false)).toBe(false);
    expect(countSuppressedOccurrence(true)).toBe(true);
  });
  it("GR-116 new signature alerts once, known is silent and rate cap is five", () => {
    expect(decideAlert({ ...base, known: false })).toBe("NEW");
    expect(decideAlert(base)).toBe("NONE");
    expect([0, 1, 2, 3, 4, 5].map(burstSlot))
      .toEqual(["INDIVIDUAL","INDIVIDUAL","INDIVIDUAL","INDIVIDUAL","SUMMARY","SUPPRESS"]);
  });
  it("GR-115 GR-116 GR-122 reopens a fixed regression with a fresh Acknowledge action", () => {
    const incident = new Date("2099-06-10T00:00:00.000Z");
    const change = reopenRegressedSignature(incident);
    expect(change).toEqual({
      fixStatus: "OPEN", regressedAt: incident, acknowledgedAt: null,
    });
  });
  it("GR-115 fixed signature reappearing after 24 hours is a regression", () => {
    expect(decideAlert({ ...base, fixStatus: "FIXED", fixedAt: new Date("2099-06-08T00:00:00Z") })).toBe("REGRESSION");
    expect(decideAlert({ ...base, fixStatus: "FIXED", fixedAt: new Date("2099-06-09T18:00:00Z") })).toBe("NONE");
  });
  it("GR-116 muted noise threshold 25; recurring spike 20; one-hour cooldown", () => {
    expect(decideAlert({ ...base, muted: true, recentCount: 24 })).toBe("NONE");
    expect(decideAlert({ ...base, muted: true, recentCount: 25 })).toBe("SPIKE");
    expect(decideAlert({ ...base, recentCount: 20 })).toBe("SPIKE");
    expect(decideAlert({ ...base, recentCount: 20, lastSpikeAt: new Date("2099-06-09T23:40:00Z") })).toBe("NONE");
  });
});
