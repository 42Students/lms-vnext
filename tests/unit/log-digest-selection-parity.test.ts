import { describe, expect, it } from "vitest";
import { boundLogDigestMessage, selectLogDigestSignatures, type LogDigestSignature } from "@/modules/operations/log-digest-selection";

const at = (hours: number) => new Date(Date.UTC(2026, 9, 22, hours));
const row = (id: string, fields: Partial<LogDigestSignature> = {}): LogDigestSignature => ({
  id, muted: false, firstSeenAt: at(12), lastSeenAt: at(13),
  regressedAt: null, fixedAt: null, fixStatus: "OPEN",
  occurrenceCount: 1, ...fields,
});

describe("legacy log digest selection", () => {
  const since = at(10);
  const until = at(18);

  it("limits new error types to ten, ordered by descending occurrence count", () => {
    const signatures = Array.from({ length: 12 }, (_, i) =>
      row(String(i), { occurrenceCount: i + 1 }));
    const result = selectLogDigestSignatures(signatures, since, until);
    expect(result.newErrors.map(value => value.id)).toEqual(
      ["11", "10", "9", "8", "7", "6", "5", "4", "3", "2"]);
    expect(result.stillActive).toBe(12);
  });

  it("keeps regression and fixed categories separate, including muted regressions", () => {
    const result = selectLogDigestSignatures([
      row("regressed", { regressedAt: at(11), muted: true }),
      row("fixed", { fixStatus: "FIXED", fixedAt: at(12) }),
      row("refixed", { fixStatus: "FIXED", fixedAt: at(12), regressedAt: at(13) }),
      row("old", { firstSeenAt: at(2), lastSeenAt: at(2) }),
    ], since, until);
    expect(result.regressions.map(value => value.id)).toEqual(["regressed", "refixed"]);
    expect(result.fixed.map(value => value.id)).toEqual(["fixed"]);
    expect(result.newErrors.map(value => value.id)).toEqual(["fixed", "refixed"]);
    expect(result.stillActive).toBe(0);
    expect(result.quiet).toBe(false);
  });

  it("reports a quiet period when neither a new nor regressed signature exists", () => {
    const result = selectLogDigestSignatures([
      row("older", { firstSeenAt: at(2), lastSeenAt: at(13) }),
    ], since, until);
    expect(result.quiet).toBe(true);
    expect(result.stillActive).toBe(1);
  });

  it("bounds the provider message and rejects an invalid time range", () => {
    expect(boundLogDigestMessage("a".repeat(4000))).toHaveLength(3800);
    expect(boundLogDigestMessage("ok")).toBe("ok");
    expect(() => selectLogDigestSignatures([], until, since)).toThrow("INVALID_DIGEST_WINDOW");
  });
});
