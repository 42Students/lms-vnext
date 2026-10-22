import {
  describe,
  expect,
  it,
} from "vitest";

import {
  formatTpoRecruiterGrantDate,
  toTpoRecruiterGrantView,
  tpoRecruiterAccessHref,
  tpoRecruiterAccessQuerySchema,
} from "@/modules/placements/tpo-recruiter-access-model";

describe("TPO recruiter grant read model", () => {
  it("preserves an active grant without inventing a revocation", () => {
    expect(
      toTpoRecruiterGrantView({
        displayName: "  Ananya Rao  ",
        companyName: "Example Company",
        status: "ACTIVE",
        grantedAt: new Date(
          "2026-10-14T10:00:00.000Z",
        ),
        revokedAt: null,
      }),
    ).toMatchObject({
      displayName: "Ananya Rao",
      companyName: "Example Company",
      status: "ACTIVE",
      grantedDate: "14 Oct 2026",
      revokedDate: null,
      // A grant without a recorded validity end fails closed, never silently perpetual.
      validUntilDate: null,
      ended: true,
      designation: null,
      capabilities: [],
      verificationStatus: "UNKNOWN",
    });
  });

  it("retains historical revoked grants and both dates", () => {
    const result = toTpoRecruiterGrantView({
      displayName: "Recruiter B",
      companyName: "Archived Relationship Ltd",
      status: "REVOKED",
      grantedAt: new Date(
        "2026-09-10T08:00:00.000Z",
      ),
      revokedAt: new Date(
        "2026-10-14T21:00:00.000Z",
      ),
    });

    expect(result).toMatchObject({
      displayName: "Recruiter B",
      companyName: "Archived Relationship Ltd",
      status: "REVOKED",
      grantedDate: expect.stringMatching(/^10 Sept? 2026$/),
      revokedDate: "15 Oct 2026",
      validUntilDate: null,
      ended: true,
      designation: null,
      capabilities: [],
      verificationStatus: "UNKNOWN",
    });
  });

  it("formats grant dates in IST across UTC midnight", () => {
    expect(
      formatTpoRecruiterGrantDate(
        new Date(
          "2026-10-14T20:30:00.000Z",
        ),
      ),
    ).toBe("15 Oct 2026");

    expect(
      formatTpoRecruiterGrantDate(null),
    ).toBeNull();
  });

  it("shows a safe fallback for a missing display name", () => {
    const result = toTpoRecruiterGrantView({
      displayName: "   ",
      companyName: "Company",
      status: "ACTIVE",
      grantedAt: new Date(
        "2026-10-01T08:00:00.000Z",
      ),
      revokedAt: null,
    });

    expect(result.displayName).toBe("Unnamed recruiter");
    expect(result.joinedVia).toBe("Not recorded");
    expect(result.maskedPhone).toBeNull();

    expect(
      Object.keys(result).sort(),
    ).toEqual([
      "capabilities",
      "companyName",
      "designation",
      "displayName",
      "ended",
      "grantedDate",
      "revokedDate",
      "status",
      "validUntilDate",
      "verificationStatus",
      "joinedVia",
      "maskedPhone",
      "grantSourceLabel",
    ].sort());
  });

  it("rejects unsupported grant statuses instead of relabelling them", () => {
    expect(() =>
      toTpoRecruiterGrantView({
        displayName: "Recruiter",
        companyName: "Company",
        status: "PENDING",
        grantedAt: new Date(
          "2026-10-01T08:00:00.000Z",
        ),
        revokedAt: null,
      }),
    ).toThrow();
  });
});

describe("TPO recruiter access filters", () => {
  it("defaults to all grants and the first page", () => {
    expect(
      tpoRecruiterAccessQuerySchema.parse({}),
    ).toEqual({
      status: "ALL",
      q: "",
      page: 1,
    });
  });

  it("accepts active and revoked filters", () => {
    expect(
      tpoRecruiterAccessQuerySchema.parse({
        status: "REVOKED",
        page: "3",
      }),
    ).toEqual({
      status: "REVOKED",
      q: "",
      page: 3,
    });

    expect(
      tpoRecruiterAccessQuerySchema.parse({
        status: "ACTIVE",
      }).status,
    ).toBe("ACTIVE");
  });

  it("rejects unsupported filters and unbounded pages", () => {
    expect(
      tpoRecruiterAccessQuerySchema.safeParse({
        status: "ARCHIVED",
      }).success,
    ).toBe(false);

    expect(
      tpoRecruiterAccessQuerySchema.safeParse({
        page: 0,
      }).success,
    ).toBe(false);

    expect(
      tpoRecruiterAccessQuerySchema.safeParse({
        page: 10001,
      }).success,
    ).toBe(false);

    expect(
      tpoRecruiterAccessQuerySchema.safeParse({
        collegeId: "other-college",
      }).success,
    ).toBe(false);
  });

  it("preserves status across pagination without adding tenant identifiers", () => {
    const url = new URL(
      tpoRecruiterAccessHref({
        status: "REVOKED",
        page: 4,
      }),
      "https://example.test",
    );

    expect(url.pathname).toBe(
      "/tpo/settings/recruiters",
    );

    expect(
      url.searchParams.get("status"),
    ).toBe("REVOKED");

    expect(
      url.searchParams.get("page"),
    ).toBe("4");

    expect(
      url.searchParams.has("collegeId"),
    ).toBe(false);
  });

  it("uses the canonical URL for default filters", () => {
    expect(
      tpoRecruiterAccessHref(),
    ).toBe(
      "/tpo/settings/recruiters",
    );

    expect(
      tpoRecruiterAccessHref({
        status: "ALL",
        page: 1,
      }),
    ).toBe(
      "/tpo/settings/recruiters",
    );
  });
});
