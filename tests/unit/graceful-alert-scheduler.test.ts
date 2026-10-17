import { describe, expect, it } from "vitest";
import { burstOverflowText, formatDailyDigest, istDayAndHour } from "@/modules/log-alerts/scheduler";
import { isValidTickSecret } from "@/app/api/internal/alerts/tick/route";

describe("scheduled Telegram alerts", () => {
  it("GR-118 refuses missing and invalid tick secrets", () => {
    expect(isValidTickSecret("expected", undefined)).toBe(false);
    expect(isValidTickSecret(null, "expected")).toBe(false);
    expect(isValidTickSecret("wrong", "expected")).toBe(false);
    expect(isValidTickSecret("expected", "expected")).toBe(true);
  });
  it("GR-116 preserves excess burst counts for a later summary", () => {
    expect(burstOverflowText(13, "DEVELOPMENT")).toContain("13 more");
    expect(burstOverflowText(13, "DEVELOPMENT")).toContain("Logs page");
    expect(burstOverflowText(Number.NaN, "PRODUCTION")).toContain("0 more");
  });
  it("GR-119 digest uses 09:00 IST rather than UTC and lists top recurring", () => {
    expect(istDayAndHour(new Date("2099-07-01T03:30:00Z")))
      .toEqual({ day: "2099-07-01", hour: 9 });
    const msg = formatDailyDigest({
      day: "2099-06-30", total: 100, firstSeen: 3, muted: 4, spikes: 1,
      top: [{ hash: "123456789abcdef", count: 90 }],
    });
    expect(msg).toContain("New signatures: 3");
    expect(msg).toContain("Recurring occurrences: 97");
    expect(msg).toContain("Deploy: not recorded");
    expect(msg).toContain("123456789abc: 90");
  });
});
