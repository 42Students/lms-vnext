import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The quarantine (tests/quarantine/ui-copy-drift.json) exists only so stale UI-copy checks cannot keep the whole gate red.
 * It must never become a hiding place: it is capped, every entry is explained and exists, and no test that asserts an
 * access or tenant rule may be parked in it.
 */
const config = JSON.parse(readFileSync("tests/quarantine/ui-copy-drift.json", "utf8")) as {
  maxEntries: number;
  files: Array<{ file: string; why: string }>;
};

// Anything that decides who may do or see something.
const SECURITY_MARKERS =
  /requirePermission|canAccessRolePortal|hasMembershipRole|AuthorizationError|isSameOrigin|csrf|tenant|\brls\b|FORBIDDEN|isSuperAdmin|getCurrentRequestContext|can\(context|sanitize|redact|rate.?limit/i;

describe("test quarantine", () => {
  it("is capped and can only shrink", () => {
    expect(config.maxEntries).toBeLessThanOrEqual(7);
    expect(config.files.length).toBeLessThanOrEqual(config.maxEntries);
  });

  it("lists real files, each with a reason, once", () => {
    const seen = new Set<string>();
    for (const entry of config.files) {
      expect(existsSync(entry.file), entry.file).toBe(true);
      expect(entry.why.trim().length, entry.file).toBeGreaterThan(15);
      expect(seen.has(entry.file), "duplicate " + entry.file).toBe(false);
      seen.add(entry.file);
    }
  });

  it("never parks a test that asserts an access, tenant, session or privacy rule", () => {
    const hidden = config.files
      .filter((entry) => SECURITY_MARKERS.test(readFileSync(entry.file, "utf8")))
      .map((entry) => entry.file);
    expect(hidden, "repair these against the current code instead of quarantining them").toEqual([]);
  });

  it("does not quarantine its own guards", () => {
    for (const entry of config.files) {
      expect(entry.file).not.toMatch(/\/sec-|\/security|auth|permission|tenant|rls/i);
    }
  });
});
