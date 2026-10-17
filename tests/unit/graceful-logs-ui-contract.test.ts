import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { friendlyApiError } from "@/lib/friendly-error";

describe("known error triage UI resilience", () => {
  it("GR-123 uses guarded actions and safe apiFetch for all Logs mutations", () => {
    const source = readFileSync("src/components/tracker/known-errors-workspace.tsx", "utf8");
    expect(source).toContain('from "@/hooks/use-guarded-action"');
    expect(source).toContain('from "@/lib/api-fetch"');
    expect(source).toContain("await run(async () =>");
    expect(source).toContain('action: "ACKNOWLEDGE"');
    expect(source).toContain('status: "FIXED"');
    expect(source).toContain('action: "MUTE"');
    expect(source).not.toMatch(/\bawait fetch\(/);
    // A FriendlyFetchError is mapped by apiFetch and safe to show.
    // An arbitrary Error instance can contain raw provider text.
    expect(source).toContain("error instanceof FriendlyFetchError");
    expect(source).not.toMatch(/error instanceof Error\s*\?\s*error\.message/);
  });
  it("GR-123 preserves legacy Known errors empty and mute confirmation wording", () => {
    const ui = readFileSync("src/components/tracker/known-errors-workspace.tsx", "utf8");
    expect(ui).toContain("No tracked errors yet");
    expect(ui).toContain("Mute this error");
    expect(ui).toContain("Why is it safe to ignore? It comes back on its own if it suddenly spikes.");
    expect(ui).toContain("setConfirmMute(true)");
    expect(ui).toContain('action: "MUTE", muted: true');
    expect(ui).toContain('action: "MUTE", muted: false');
  });
  it("GR-124 does not imply Cloud Logging backup is active when unconfigured", async () => {
    const { cloudLogPollConfigured } = await import("@/modules/log-alerts/readiness");
    const original = process.env.LOG_ALERT_CLOUD_POLL_ENABLED;
    try {
      delete process.env.LOG_ALERT_CLOUD_POLL_ENABLED;
      expect(cloudLogPollConfigured()).toBe(false);
    } finally {
      if (original === undefined) delete process.env.LOG_ALERT_CLOUD_POLL_ENABLED;
      else process.env.LOG_ALERT_CLOUD_POLL_ENABLED = original;
    }
    const source = readFileSync("src/app/(authenticated)/tracker/logs/page.tsx", "utf8");
    expect(source).toContain("Cloud Logging backup is not configured.");
  });
  it("GR-124 shows plain errors rather than raw codes for expected admin failures", () => {
    for (const [status, code] of [[400, "INVALID_REQUEST"], [403, "FORBIDDEN"], [404, "KNOWN_ERROR_NOT_FOUND"]] as const) {
      expect(friendlyApiError({ status, code })).not.toBe(code);
      expect(friendlyApiError({ status, code })).not.toMatch(/^[A-Z][A-Z0-9_]{5,}$/);
    }
  });
});
