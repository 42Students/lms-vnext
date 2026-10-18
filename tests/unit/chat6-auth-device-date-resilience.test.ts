import { describe, expect, it } from "vitest";
import { describeDevice, deviceTimestampIso } from "@/modules/auth/device-label";

describe("auth session device list: corrupted server records and hostile labels", () => {
  it("AUTH-DEVICE-01 converts valid database timestamps to stable ISO without changing the instant", () => {
    expect(deviceTimestampIso(new Date("2026-10-19T01:20:30.000Z"))).toBe("2026-10-19T01:20:30.000Z");
    expect(deviceTimestampIso("2026-10-19T06:50:30+05:30")).toBe("2026-10-19T01:20:30.000Z");
  });

  it("AUTH-DEVICE-02 prevents invalid nullable or corrupt timestamps from crashing the revoke screen", () => {
    for (const invalid of [null, undefined, "", "not a timestamp", Number.NaN, Infinity, 0, {}, new Date(Number.NaN)]) {
      expect(deviceTimestampIso(invalid), String(invalid)).toBeNull();
    }
  });

  it("AUTH-DEVICE-03 does not echo unsanitized user-agent strings as trusted device labels", () => {
    expect(describeDevice("")).toBe("Unknown device");
    expect(describeDevice("<img src=x onerror=alert(1)>")).toBe("Unknown device");
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0")).toBe("Chrome on Windows");
    expect(describeDevice("Mozilla/5.0 (iPhone) Safari/605.1")).toBe("Safari on iOS");
  });
});
