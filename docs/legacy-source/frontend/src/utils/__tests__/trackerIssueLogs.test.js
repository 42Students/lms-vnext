import { formatOffset, issueLogWindow, rankNearbyEntries, trackerDateMs, WINDOW_MINUTES } from "../trackerIssueLogs";

const CREATED = [2026, 9, 28, 5, 9, 4, 354662000];
const AT = Date.UTC(2026, 8, 28, 5, 9, 4);

describe("trackerDateMs", () => {
  test("reads the backend's array form as UTC and ISO strings alike", () => {
    expect(trackerDateMs(CREATED)).toBe(AT);
    expect(trackerDateMs("2026-09-28T05:09:04Z")).toBe(AT);
    expect(trackerDateMs(null)).toBeNull();
    expect(trackerDateMs("nope")).toBeNull();
  });
});

describe("issueLogWindow", () => {
  const NOW = AT + 60 * 60_000;

  test("spans a few minutes either side of the report in the reported environment", () => {
    const w = issueLogWindow({ environment: "PRODUCTION", createdAt: CREATED }, NOW);
    expect(w.environment).toBe("PRODUCTION");
    expect(new Date(w.since).getTime()).toBe(AT - WINDOW_MINUTES * 60_000);
    expect(new Date(w.until).getTime()).toBe(AT + WINDOW_MINUTES * 60_000);
  });

  test("never reaches into the future for a very recent report", () => {
    const w = issueLogWindow({ environment: "DEVELOPMENT", createdAt: CREATED }, AT + 60_000);
    expect(new Date(w.until).getTime()).toBe(AT + 60_000);
  });

  test("nothing to look up for other environments, missing dates or future moments", () => {
    expect(issueLogWindow({ environment: "LOCAL", createdAt: CREATED }, NOW)).toBeNull();
    expect(issueLogWindow({ environment: "NOT_SURE", createdAt: CREATED }, NOW)).toBeNull();
    expect(issueLogWindow({ environment: "PRODUCTION" }, NOW)).toBeNull();
    expect(issueLogWindow({ environment: "PRODUCTION", createdAt: CREATED }, AT - 1)).toBeNull();
    expect(issueLogWindow(null, NOW)).toBeNull();
  });
});

describe("formatOffset and ranking", () => {
  test("offsets read naturally in both directions", () => {
    expect(formatOffset(AT + 130_000, AT)).toBe("+2m 10s");
    expect(formatOffset(AT - 45_000, AT)).toBe("-45s");
    expect(formatOffset(AT, AT)).toBe("+0s");
  });

  test("errors come before warnings, nearest first, and log tooling is dropped", () => {
    const at = (offset) => new Date(AT + offset).toISOString();
    const ranked = rankNearbyEntries(
      [
        { severity: "WARNING", timestamp: at(1_000), message: "warn-near" },
        { severity: "ERROR", timestamp: at(200_000), message: "err-far" },
        { severity: "ERROR", timestamp: at(-5_000), message: "err-near" },
        { severity: "ERROR", timestamp: at(0), message: "tooling", httpPath: "/api/v1/superadmin/logs/query" },
      ],
      AT
    );
    expect(ranked.map((e) => e.message)).toEqual(["err-near", "err-far", "warn-near"]);
  });
});
