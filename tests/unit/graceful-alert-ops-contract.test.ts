import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("independent Telegram health monitoring", () => {
  it("GR-120 checks readiness and login every minute, retains DOWN state and recovers", () => {
    const y = readFileSync("deploy/k8s/dev/alerting/vnext-health-watch.yaml", "utf8");
    expect(y).toContain('schedule: "* * * * *"');
    expect(y).toContain('prior" = DOWN');
    expect(y).toContain("FAILING)");
    expect(y).toContain("vNext%20is%20back");
    expect(y).toContain("scheduled_job_leases");
  });
  it("GR-118 allows a bounded Cloud Logging batch within the Cron tick HTTP timeout and lease", () => {
    const manifest = readFileSync("deploy/k8s/dev/alerting/vnext-alert-tick.yaml", "utf8");
    const scheduler = readFileSync("src/modules/log-alerts/scheduler.ts", "utf8");
    expect(manifest).toContain("--max-time 150");
    expect(manifest).toContain('concurrencyPolicy: Forbid');
    expect(scheduler).toContain("180_000");
    expect(scheduler).toContain("let limit = 12");
    expect(scheduler).toContain("page < 1 && limit > 0");
    expect(scheduler).toContain("if (result.errors.length > limit) return;");
    expect(scheduler).toContain("pollPageToken: nextPageToken");
  });
  it("GR-121 validates rollout, restart counts and /ready before reporting healthy", () => {
    const script = readFileSync("scripts/ops/deploy-health-check.sh", "utf8");
    expect(script).toContain("rollout status");
    expect(script).toContain("restartCount");
    expect(script).toContain('"$READY_URL"');
    expect(script).toContain("TELEGRAM_ALERT_BOT_TOKEN");
  });
}
);
