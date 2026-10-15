import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatTpoProfileRole,
  TPO_MORE_GROUPS,
} from "@/modules/placements/tpo-utility-model";

type MoreLink = {
  label: string;
  href: string;
  description: string;
};

const links: MoreLink[] = TPO_MORE_GROUPS.flatMap(
  (group): MoreLink[] => [...group.links],
);

describe("TPO profile role formatting", () => {
  it("preserves the TPO acronym", () => {
    expect(formatTpoProfileRole("TPO")).toBe(
      "TPO",
    );
  });

  it("formats other stored membership roles", () => {
    expect(
      formatTpoProfileRole("FACULTY"),
    ).toBe("Faculty");

    expect(
      formatTpoProfileRole("COLLEGE_ADMIN"),
    ).toBe("College Admin");
  });
});

describe("TPO More navigation", () => {
  it("contains the required utility destinations", () => {
    const destinations = links.map(
      (link) => link.href,
    );

    expect(destinations).toEqual([
      "/tpo/students",
      "/tpo/requests",
      "/tpo/calendar",
      "/tpo/reports",
      "/tpo/notifications",
      "/tpo/audit",
      "/tpo/recruiters?view=companies",
      "/tpo/profile",
    ]);
  });

  it("contains no duplicate destinations", () => {
    const destinations = links.map(
      (link) => link.href,
    );

    expect(
      new Set(destinations).size,
    ).toBe(destinations.length);
  });

  it("links only to implemented TPO pages", () => {
    for (const link of links) {
      const url = new URL(
        link.href,
        "https://lms.example.test",
      );

      expect(url.pathname.startsWith("/tpo/"))
        .toBe(true);

      const page = join(
        process.cwd(),
        "src/app/(authenticated)",
        url.pathname.slice(1),
        "page.tsx",
      );

      expect(
        existsSync(page),
        `${link.href} should resolve to an existing TPO page`,
      ).toBe(true);
    }
  });

  it("uses the working companies view rather than a name-dependent redirect", () => {
    const companies = links.find(
      (link) => link.label === "Companies",
    );

    expect(companies?.href).toBe(
      "/tpo/recruiters?view=companies",
    );
    expect(companies?.href).not.toBe(
      "/tpo/companies",
    );
  });

  it("does not link unimplemented utilities", () => {
    const destinations = links.map(
      (link) => link.href,
    );

    for (const unavailable of [
      "/tpo/messages",
      "/tpo/settings",
    ]) {
      expect(destinations).not.toContain(
        unavailable,
      );
    }
  });
});
