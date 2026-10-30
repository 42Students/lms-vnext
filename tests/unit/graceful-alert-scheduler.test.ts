import { describe, expect, it } from "vitest";
import { burstOverflowText, cloudPollSettings, cloudPollWindow, formatDailyDigest, healthWatchStatus, istDayAndHour, runOptionalAlertTask } from "@/modules/log-alerts/scheduler";
import { isValidTickSecret } from "@/app/api/internal/alerts/tick/route";

describe("scheduled Telegram alerts", () => {
  it("GR-118 refuses missing and invalid tick secrets", () => {
    expect(isValidTickSecret("expected", undefined)).toBe(false);
    expect(isValidTickSecret(null, "expected")).toBe(false);
    expect(isValidTickSecret("wrong", "expected")).toBe(false);
    expect(isValidTickSecret("expected", "expected")).toBe(true);
  });
  it("GR-118 sweeps fixed signatures only after 24 hours and never marks them reported before send", async () => {
    const { decideAlert } = await import("@/modules/log-alerts/policy");
    const now = new Date("2099-07-01T03:30:00Z");
    expect(decideAlert({
      known: true, muted: false, fixStatus: "FIXED", fixedAt: new Date("2099-06-29T00:00:00Z"),
      recentCount: 1, lastSpikeAt: null, now,
    })).toBe("REGRESSION");
  });
  it("GR-118 GR-119 GR-125 isolates failed optional checks without stopping later digest work", async () => {
    const providerFailure = new Error("synthetic provider URL and secret");
    let continued = false;
    expect(await runOptionalAlertTask(async () => { throw providerFailure; })).toBe(false);
    expect(await runOptionalAlertTask(async () => { continued = true; })).toBe(true);
    expect(continued).toBe(true);
    const { readFileSync } = await import("node:fs");
    const scheduler = readFileSync("src/modules/log-alerts/scheduler.ts", "utf8");
    expect(scheduler).toContain("await runOptionalAlertTask(() => flushOverflow(now))");
    expect(scheduler).toContain("await runOptionalAlertTask(() => sweepUndeliveredRegressions(now))");
    expect(scheduler).toContain("await pollCloudLoggingErrors(now)");
    expect(scheduler).toContain('withScheduledLease("telegram-digest-" + environment');
  });

  it("GR-116 preserves excess burst counts for a later summary", () => {
    expect(burstOverflowText(13, "DEVELOPMENT")).toContain("13 more");
    expect(burstOverflowText(13, "DEVELOPMENT")).toContain("Logs page");
    expect(burstOverflowText(Number.NaN, "PRODUCTION")).toContain("0 more");
    expect(burstOverflowText(9007199254740997n, "PRODUCTION"))
      .toContain("9007199254740997 more");
    expect(burstOverflowText("9007199254740999", "PRODUCTION"))
      .toContain("9007199254740999 more");
  });
  it("GR-118 resumes the exact provider page and timestamp window after a bounded tick", () => {
    const now = new Date("2099-07-01T03:30:00Z");
    const start = new Date("2099-06-30T20:00:00Z");
    const end = new Date("2099-07-01T03:00:00Z");
    expect(cloudPollWindow({
      pollCursorAt: new Date("2099-06-30T19:00:00Z"),
      pollPageToken: "safe-next-page", pollWindowStartAt: start, pollWindowEndAt: end,
    }, now)).toEqual({ start, end, pageToken: "safe-next-page" });
    const fresh = cloudPollWindow({
      pollCursorAt: new Date("2099-07-01T03:00:00Z"),
      pollPageToken: null, pollWindowStartAt: null, pollWindowEndAt: null,
    }, now);
    expect(fresh?.start.toISOString()).toBe("2099-07-01T02:58:00.000Z");
    expect(fresh?.end.toISOString()).toBe("2099-07-01T03:29:00.000Z");
  });
  it("GR-118 requires explicit Cloud Logging enablement and namespace in production", () => {
    expect(cloudPollSettings({ APP_ENV: "production", GOOGLE_CLOUD_PROJECT: "lms-vnext-1234" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(cloudPollSettings({ APP_ENV: "production", GOOGLE_CLOUD_PROJECT: "lms-vnext-1234", LOG_ALERT_CLOUD_POLL_ENABLED: "true" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(cloudPollSettings({ APP_ENV: "uat", GOOGLE_CLOUD_PROJECT: "lms-vnext-1234", LOG_ALERT_CLOUD_POLL_ENABLED: "true" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(cloudPollSettings({ APP_ENV: "production", GOOGLE_CLOUD_PROJECT: "lms-vnext-1234", LOG_ALERT_CLOUD_POLL_ENABLED: "true", LOG_ALERT_K8S_NAMESPACE: "lms-production" } as unknown as NodeJS.ProcessEnv))
      .toEqual({ project: "lms-vnext-1234", namespace: "lms-production" });
  });
  it("GR-120 includes reliable health status and detects a stopped watcher", () => {
    const now = new Date("2099-07-01T03:30:00Z");
    expect(healthWatchStatus(undefined, now)).toBe("not configured");
    expect(healthWatchStatus({ lockedBy: "HEALTHY", updatedAt: now }, now)).toBe("healthy");
    expect(healthWatchStatus({ lockedBy: "DOWN", updatedAt: now }, now)).toBe("not responding");
    expect(healthWatchStatus({ lockedBy: "FAILING", updatedAt: now }, now)).toBe("degraded");
    expect(healthWatchStatus({ lockedBy: "HEALTHY", updatedAt: new Date("2099-07-01T03:00:00Z") }, now)).toBe("watcher stale");
  });
  it("GR-119 aggregates all error signatures while limiting only displayed top entries", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/modules/log-alerts/scheduler.ts", "utf8");
    expect(source).toContain("coalesce(sum(");
    expect(source).toContain("count(*) filter");
    expect(source).toContain(".limit(5)");
    expect(source).not.toContain(".limit(1000)");
  });
  it("DB-023 formats bigint daily counts without floating-point precision loss", async () => {
    const aboveMax = "9007199254740995";
    const msg = formatDailyDigest({
      day: "2099-06-30",
      total: aboveMax,
      firstSeen: "5",
      muted: 4n,
      spikes: "2",
      top: [{ hash: "a".repeat(64), count: aboveMax }],
    });
    expect(msg).toContain("Errors: 9007199254740995");
    expect(msg).toContain("Recurring occurrences: 9007199254740990");
    expect(msg).toContain("New signatures: 5");
    expect(msg).toContain("Muted signatures: 4");
    expect(msg).toContain("aaaaaaaaaaaa: 9007199254740995 occurrences");
    expect(msg).not.toContain("9007199254740996");
    // The SQL must request decimal text before Drizzle's number-mode mapping.
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/modules/log-alerts/scheduler.ts", "utf8");
    expect(source).toContain('count: sql<string>`${daily.occurrenceCount}::text`');
    expect(source).not.toContain("total: Number(counts?.total");
  });

  it("DB-023 maps all unbounded PostgreSQL alert histories to exact bigint values", async () => {
    const { readFileSync } = await import("node:fs");
    const schema = readFileSync("src/db/schema/db10-log-alerts.draft.ts", "utf8");
    for (const [name, initial] of [
      ["day_occurrences", "sql`1`"],
      ["overflow_count", "sql`0`"],
      ["occurrence_count", "sql`1`"],
      ["spike_count", "sql`0`"],
    ]) {
      expect(schema).toContain(
        `bigint("${name}", { mode: "bigint" }).notNull().default(${initial})`,
      );
    }
    const reporter = readFileSync("src/modules/log-alerts/reporter.ts", "utf8");
    expect(reporter).toContain("current.dayOccurrences + 1n");
    expect(reporter).toContain("Math.min(25, current.recentWindowCount + 1)");
    expect(reporter).toContain("occurrenceCount: 1n");
    const scheduler = readFileSync("src/modules/log-alerts/scheduler.ts", "utf8");
    expect(scheduler).toContain("overflowCount: 0n");
  });

  it("DB-023 keeps invalid/unsafe count presentations bounded", () => {
    const msg = formatDailyDigest({
      day: "2099-06-30",
      total: Number.MAX_SAFE_INTEGER + 2,
      firstSeen: "not-a-count", muted: -1, spikes: 1.5,
      top: [{ hash: "123456789abc", count: "7" }],
    });
    expect(msg).toContain("Errors: 0");
    expect(msg).toContain("Recurring occurrences: 0");
    expect(msg).toContain("New signatures: 0");
    expect(msg).toContain("Muted signatures: 0");
    expect(msg).toContain("Spike signatures: 0");
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
    expect(msg).toContain("Health watch: not configured");
    expect(msg).toContain("123456789abc: 90");
  });
});
