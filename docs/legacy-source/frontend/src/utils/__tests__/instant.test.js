import { instantIso, instantMs, normalizeDeploy, normalizeDigest, normalizeKnownError } from "../instant";

// Values copied from real responses of /superadmin/logs/deploys and /status.
const SECONDS = 1790608529.299667608;
const ISO = "2026-09-28T15:15:29.300Z";

describe("instantMs / instantIso", () => {
  test("epoch seconds from the API become the right moment, not January 1970", () => {
    expect(new Date(SECONDS).getUTCFullYear()).toBe(1970); // the bug this guards against
    expect(instantMs(SECONDS)).toBe(1790608529300);
    expect(instantIso(SECONDS)).toBe(ISO);
  });

  test("milliseconds, ISO strings and blanks pass through sensibly", () => {
    expect(instantMs(1790608529300)).toBe(1790608529300);
    expect(instantMs(ISO)).toBe(1790608529300);
    expect(instantMs("")).toBeNull();
    expect(instantMs(null)).toBeNull();
    expect(instantMs("not a date")).toBeNull();
    expect(instantMs(Infinity)).toBeNull();
    expect(instantIso(undefined)).toBeNull();
  });
});

describe("normalizers", () => {
  test("a deploy marker's time becomes an ISO string and other fields are kept", () => {
    expect(normalizeDeploy({ at: SECONDS, commit: "abc", pods: 2 })).toEqual({ at: ISO, commit: "abc", pods: 2 });
  });

  test("a known error's timestamps are normalized, and absent ones stay absent", () => {
    const row = normalizeKnownError({ id: 3, firstSeenAt: SECONDS, lastSeenAt: SECONDS, regressedAt: null, muted: false });
    expect(row.firstSeenAt).toBe(ISO);
    expect(row.regressedAt).toBeNull();
    expect(row.muted).toBe(false);
    expect("fixedAt" in row).toBe(false);
  });

  test("a whole digest is normalized, including nested items and deploys", () => {
    const digest = normalizeDigest({
      since: SECONDS - 86400,
      until: SECONDS,
      newErrors: [{ id: 1, firstSeenAt: SECONDS, lastSeenAt: SECONDS }],
      regressions: [],
      deploys: [{ at: SECONDS, commit: "abc", pods: 2 }],
      stillActive: 4,
      quiet: false,
    });
    expect(digest.until).toBe(ISO);
    expect(digest.newErrors[0].firstSeenAt).toBe(ISO);
    expect(digest.fixed).toEqual([]);
    expect(digest.deploys[0].at).toBe(ISO);
    expect(digest.stillActive).toBe(4);
  });

  test("null and non-objects are returned unchanged", () => {
    expect(normalizeDigest(null)).toBeNull();
    expect(normalizeDeploy(undefined)).toBeUndefined();
  });
});
