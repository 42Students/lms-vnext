import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, DEFAULT_TIME_ZONE } from "@/config/locale";
import { fixedClock, installClock, now, nowMs, timeZoneForCollege } from "@/lib/clock";
import { readFileSync } from "node:fs";
import { formatDateIst } from "@/lib/format-date";

let restore: (() => void) | null = null;
afterEach(() => restore?.());

describe("clock", () => {
  it("returns the installed time and restores the system clock", () => {
    restore = installClock(fixedClock("2026-03-01T00:00:00Z"));
    expect(nowMs()).toBe(Date.parse("2026-03-01T00:00:00Z"));
    expect(now().toISOString()).toBe("2026-03-01T00:00:00.000Z");
    restore();
    restore = null;
    expect(Math.abs(nowMs() - Date.now())).toBeLessThan(1000);
  });
  it("nests: restoring returns to the previous clock, not the system one", () => {
    const outer = installClock(fixedClock(1000));
    const inner = installClock(fixedClock(2000));
    expect(nowMs()).toBe(2000);
    inner();
    expect(nowMs()).toBe(1000);
    outer();
  });
});

describe("locale and zone", () => {
  it("has one default zone and every college uses it until a per-college zone is stored", () => {
    expect(DEFAULT_TIME_ZONE).toBe("Asia/Kolkata");
    expect(DEFAULT_LOCALE).toBe("en-IN");
    expect(timeZoneForCollege("any-college")).toBe(DEFAULT_TIME_ZONE);
    expect(timeZoneForCollege(null)).toBe(DEFAULT_TIME_ZONE);
  });
  it("formats a date in the default zone: 20:00 UTC is already the next day in India", () => {
    expect(formatDateIst("2026-03-01T20:00:00Z")).toContain("2 Mar 2026");
  });
  it("keeps the alias-free copy in the node-loaded debar view model equal to the default zone", () => {
    const source = readFileSync("src/modules/placements/tpo-timed-debar-view-model.ts", "utf8");
    expect(source).toContain(`const INDIA_TIME_ZONE = "${DEFAULT_TIME_ZONE}";`);
  });
});
