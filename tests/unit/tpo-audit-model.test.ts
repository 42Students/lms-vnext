import {
  describe,
  expect,
  it,
} from "vitest";

import {
  formatTpoAuditEventType,
  summarizeTpoAuditKinds,
  tpoAuditHref,
  TPO_AUDIT_KINDS,
  TPO_AUDIT_KIND_LABELS,
} from "@/modules/placements/tpo-audit-model";

describe("TPO audit event kinds", () => {
  it("provides a label for every persisted audit category", () => {
    expect(TPO_AUDIT_KINDS).toHaveLength(8);

    for (const kind of TPO_AUDIT_KINDS) {
      expect(
        TPO_AUDIT_KIND_LABELS[kind].length,
      ).toBeGreaterThan(0);
    }
  });

  it("formats machine event types for display", () => {
    expect(
      formatTpoAuditEventType(
        "placements.screening.decided",
      ),
    ).toBe("Placements screening decided");

    expect(
      formatTpoAuditEventType(
        "DOWNLOADED_ZIP",
      ),
    ).toBe("Downloaded zip");
  });
});

describe("TPO audit summary", () => {
  it("combines only the supplied persisted counts", () => {
    const result =
      summarizeTpoAuditKinds([
        {
          kind: "ACTIVITY",
          total: 5,
        },
        {
          kind: "SCREENING",
          total: 3,
        },
        {
          kind: "OFFER",
          total: 2,
        },
        {
          kind: "SHARE",
          total: 4,
        },
      ]);

    expect(result.total).toBe(14);
    expect(result.decisionsAndChanges).toBe(5);
    expect(result.shares).toBe(4);
    expect(result.canonicalEvents).toBe(5);
    expect(result.byKind.ROUND).toBe(0);
  });

  it("does not invent events when source groups are empty", () => {
    const result =
      summarizeTpoAuditKinds([]);

    expect(result.total).toBe(0);
    expect(result.shares).toBe(0);

    expect(
      Object.values(result.byKind),
    ).toEqual(Array(8).fill(0));
  });

  it("does not mutate input groups", () => {
    const groups = [
      {
        kind: "JOINING" as const,
        total: 7,
      },
    ];

    summarizeTpoAuditKinds(groups);

    expect(groups).toEqual([
      {
        kind: "JOINING",
        total: 7,
      },
    ]);
  });
});

describe("TPO audit URL filters", () => {
  it("uses the canonical route for default filters", () => {
    expect(tpoAuditHref({})).toBe(
      "/tpo/audit",
    );

    expect(
      tpoAuditHref({
        kind: "ALL",
        page: 1,
        pageSize: 25,
      }),
    ).toBe("/tpo/audit");
  });

  it("preserves the complete filter set between pages", () => {
    const href = tpoAuditHref({
      kind: "SCREENING",
      from: "2026-10-01",
      to: "2026-10-14",
      q: "Campus & hiring",
      page: 3,
      pageSize: 50,
    });

    const url = new URL(
      href,
      "https://example.test",
    );

    expect(url.pathname).toBe(
      "/tpo/audit",
    );

    expect(
      Object.fromEntries(
        url.searchParams,
      ),
    ).toEqual({
      kind: "SCREENING",
      from: "2026-10-01",
      to: "2026-10-14",
      q: "Campus & hiring",
      page: "3",
      pageSize: "50",
    });
  });

  it("trims search input and does not introduce a college override", () => {
    const href = tpoAuditHref({
      q: "  assessment  ",
      kind: "RESULT",
    });

    const url = new URL(
      href,
      "https://example.test",
    );

    expect(url.searchParams.get("q")).toBe(
      "assessment",
    );

    expect(
      url.searchParams.has("collegeId"),
    ).toBe(false);
  });
});
