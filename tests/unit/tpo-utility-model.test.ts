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
      "Placement officer",
    );
  });

  it("formats other stored membership roles", () => {
    expect(
      formatTpoProfileRole("FACULTY"),
    ).toBe("Placement team");

    expect(
      formatTpoProfileRole("COLLEGE_ADMIN"),
    ).toBe("College admin (acts as placement officer)");
  });
});

describe("TPO More navigation", () => {
  it("contains the required utility destinations", () => {
    const destinations = links.map(
      (link) => link.href,
    );

    expect(destinations).toEqual([
      "/tpo/batches", "/tpo/requests", "/tpo/calendar",
      "/tpo/announcements", "/tpo/messages",
      "/tpo/settings?tab=team", "/tpo/reports", "/tpo/notifications",
      "/tpo/settings", "/tpo/audit", "/tpo/profile",
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

  it("keeps placement team management inside the working TPO settings workspace", () => {
    const team = links.find((link) => link.label === "Placement team");
    expect(team?.href).toBe("/tpo/settings?tab=team");
    expect(links.some(link => link.label === "Companies")).toBe(false);
  });

  it("links messaging and settings only through existing TPO workspaces", () => {
    const destinations = links.map((link) => link.href);
    expect(destinations).toContain("/tpo/messages");
    expect(destinations).toContain("/tpo/settings");
    expect(destinations).toContain("/tpo/settings?tab=team");
  });
});
